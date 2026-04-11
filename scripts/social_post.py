"""
social_post.py — Standalone script for scheduled LinkedIn + X post generation and publishing.

Run by GitHub Actions twice daily (10 AM IST and 6 PM IST).
No Supabase dependency — fully self-contained.

Required environment variables:
  ANTHROPIC_API_KEY
  LI_ACCESS_TOKEN, LI_PERSON_URN
  X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
"""

import logging
import os
import sys

import anthropic
import httpx
from xdk import Client as XClient
from xdk.oauth1_auth import OAuth1
from xdk.posts.models import CreateRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── Environment ───────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
LI_ACCESS_TOKEN = os.environ["LI_ACCESS_TOKEN"]
LI_PERSON_URN = os.environ["LI_PERSON_URN"]
X_CONSUMER_KEY = os.environ["X_CONSUMER_KEY"]
X_CONSUMER_SECRET = os.environ["X_CONSUMER_SECRET"]
X_ACCESS_TOKEN = os.environ["X_ACCESS_TOKEN"]
X_ACCESS_TOKEN_SECRET = os.environ["X_ACCESS_TOKEN_SECRET"]

# ── Claude tools ──────────────────────────────────────────────────────────────

_WEB_SEARCH_TOOL = {
    "type": "web_search_20250305",
    "name": "web_search",
    "max_uses": 3,
}

_DUAL_POST_TOOL = {
    "name": "save_dual_platform_posts",
    "description": "Save the generated LinkedIn post and X post. Call this tool exactly once after researching and writing.",
    "input_schema": {
        "type": "object",
        "properties": {
            "linkedin_post": {
                "type": "string",
                "description": "Full LinkedIn post text. Max 1300 characters. No preamble, no labels.",
            },
            "x_post": {
                "type": "string",
                "description": "X (Twitter) post text. STRICTLY under 280 characters total.",
            },
        },
        "required": ["linkedin_post", "x_post"],
    },
}

# ── Prompts ───────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """<role>
You are an AI Agentic Engineer writing on LinkedIn and X to build your personal brand and attract opportunities — consulting, collaborations, full-time roles, or just being known as someone worth following in the AI/ML/agentic automation space.

Write the post. Return ONLY the post text. No preamble, no labels, no explanation.
</role>

<audience>
The primary reader is:
  - AI/ML engineers and researchers curious about what's actually shipping
  - Founders and CTOs evaluating agentic tools and frameworks
  - Developers building with LLMs, agents, and automation pipelines
  - Tech enthusiasts who follow the AI space closely and want signal, not noise

What makes them stop scrolling:
  - A sharp take on something that just dropped — model release, paper, tool, controversy
  - Someone who clearly understands the engineering reality behind the hype
  - A contrarian read on a trending topic that makes them think twice
  - Specific technical insight wrapped in plain language

What does NOT land:
  - Generic "AI is changing everything" takes
  - Content that summarises news without adding a perspective
  - Hype without critique or depth
  - Anything that sounds like it was written to go viral, not to say something true
</audience>

<voice>
Conversational, direct, technically grounded. Zero corporate.
Write like you're texting a smart engineer friend who will call you out if you sound fake.

NEVER use:
  "excited to share" / "game-changer" / "let's connect" / "thoughts?" / "drop a comment"
  Em-dashes as separators — immediate AI tell
  Generic lessons ("I learned that persistence pays off")
  "This is important because" — just say the thing

Voice markers:
  - Lowercase hooks feel natural
  - Specific over vague: name the model, the paper, the framework, the company
  - Honest reactions: what surprised you, what disappointed you, what you're still figuring out
  - Dry humour when it fits — never forced
  - Confident opinions, but willing to hold uncertainty when it's real
</voice>

<structure>
  LINE 1 — HOOK
    Only line most people see before "see more". Must earn scroll-stop in under 3 seconds.

  BODY (2-4 short paragraphs)
    One blank line between every paragraph. 1-3 sentences per paragraph.

  CLOSE (1 line)
    A sharp takeaway, a quiet observation, or honest uncertainty.
    Never a question fishing for engagement.
</structure>

<format_rules>
  Max 1300 characters — shorter is often better
  One blank line between every paragraph
  0-1 hashtags max — none is usually better
  No URLs or links — links kill LinkedIn reach
  No em-dashes as separators
  No bullet points unless the post is explicitly a list
</format_rules>

<anti_patterns>
Rewrite immediately if you catch any of these:
  - "I recently..." / "I've been thinking about..."
  - "Here's the thing:" / "Here's what nobody tells you:"
  - "Let me be honest:" / "Real talk:" / "Unpopular opinion:"
  - Hook poses a question, answers it 3 paragraphs later
  - Every post ends on an upswing — conflict resolves into triumph
  - Key word in ALL CAPS for emphasis
</anti_patterns>"""

_DYNAMIC_PROMPT = """<post_type>
TYPE: Trending AI/ML/Agentic News Reaction

YOU MUST use web_search before writing. Do not skip this.

Search for what is actually happening RIGHT NOW in AI, ML, agentic automation, and tech:
  - "AI model release [current month year]"
  - "LLM news this week" / "Anthropic OR OpenAI OR Google DeepMind news"
  - "agentic AI framework launch" / "AI agents trending"
  - "AI startup funding OR acquisition this week"
  - "machine learning paper trending" / "AI research breakthrough"

Pick ONE story that you — an AI Agentic Engineer — have a genuine, specific reaction to.
Something you'd read and immediately form an opinion about.

Then write your REACTION — not a summary. Your take on what it means:
  - What does this reveal about where AI/agents are actually heading?
  - What are people getting wrong about it?
  - What's the engineering reality behind the announcement?
  - What's ironic, surprising, or frustrating about it in a way that stings?

Angle: THE REACTION or THE CONTRARIAN TAKE.
No URL in the post — links kill LinkedIn reach.
</post_type>

<x_post_rules>
Also write an X post distilling the same core idea.
STRICTLY under 280 characters total (including spaces).

Punchy, opinionated, engineer-voiced. Every word earns its place.
A hot take someone wants to retweet — not a summary of the LinkedIn post.

No hashtags unless essential. No em-dashes. No filler openers. No questions at the end.
Lowercase is fine. Raw opinion is the goal.
</x_post_rules>"""

# ── Generation ────────────────────────────────────────────────────────────────

def generate_posts() -> tuple[str, str]:
    """Call Claude with web_search to research trending news and generate both posts.

    Returns (linkedin_text, x_text).
    """
    # 300-second timeout: web_search (up to 3 calls) + generation comfortably fits in ~90s.
    # The job-level timeout-minutes=10 is the hard outer cap.
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, timeout=300)

    logger.info("Calling Claude to research and generate posts...")
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        tools=[_WEB_SEARCH_TOOL, _DUAL_POST_TOOL],
        tool_choice={"type": "auto"},
        system=[
            {"type": "text", "text": _SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": _DYNAMIC_PROMPT},
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    "Use web_search to find what's happening in tech/AI/SaaS/startups right now. "
                    "Then write both posts by calling save_dual_platform_posts."
                ),
            }
        ],
    )

    tool_block = next(
        (b for b in response.content if getattr(b, "type", None) == "tool_use" and b.name == "save_dual_platform_posts"),
        None,
    )
    if tool_block is None:
        raise RuntimeError("Claude did not call save_dual_platform_posts — no posts generated")

    inputs: dict = tool_block.input or {}
    linkedin_text = (inputs.get("linkedin_post") or "").strip()
    x_text = (inputs.get("x_post") or "").strip()

    if not linkedin_text:
        raise RuntimeError("save_dual_platform_posts returned empty linkedin_post")
    if not x_text:
        raise RuntimeError("save_dual_platform_posts returned empty x_post")

    if len(x_text) > 280:
        logger.warning("X post exceeds 280 chars (%d), truncating", len(x_text))
        x_text = x_text[:277] + "..."

    cache_hits = getattr(response.usage, "cache_read_input_tokens", 0)
    logger.info(
        "Posts generated [cached=%s]: LI=%d chars | X=%d chars",
        cache_hits > 0,
        len(linkedin_text),
        len(x_text),
    )
    return linkedin_text, x_text


# ── LinkedIn publishing ───────────────────────────────────────────────────────

def publish_linkedin(text: str) -> None:
    """Publish a text-only post to LinkedIn via the REST Posts API."""
    headers = {
        "Authorization": f"Bearer {LI_ACCESS_TOKEN}",
        "Linkedin-Version": "202503",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
    }
    payload = {
        "author": LI_PERSON_URN,
        "commentary": text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }

    with httpx.Client(timeout=30) as http:
        resp = http.post("https://api.linkedin.com/rest/posts", headers=headers, json=payload)

    if resp.status_code in (200, 201):
        post_id = resp.headers.get("x-restli-id", "unknown")
        logger.info("LinkedIn post published: %s | %.80s...", post_id, text)
    else:
        raise RuntimeError(f"LinkedIn API {resp.status_code}: {resp.text[:300]}")


# ── X publishing ──────────────────────────────────────────────────────────────

def publish_x(text: str) -> None:
    """Publish a post to X via the official XDK using OAuth 1.0a — same as backend."""
    client = XClient(
        auth=OAuth1(
            api_key=X_CONSUMER_KEY,
            api_secret=X_CONSUMER_SECRET,
            callback="",
            access_token=X_ACCESS_TOKEN,
            access_token_secret=X_ACCESS_TOKEN_SECRET,
        )
    )
    response = client.posts.create(body=CreateRequest(text=text))
    tweet_id = ""
    if hasattr(response, "data") and response.data:
        data = response.data
        tweet_id = data.get("id", "") if isinstance(data, dict) else getattr(data, "id", "")
    logger.info("X post published: %s | %.80s...", tweet_id, text)


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    linkedin_text, x_text = generate_posts()

    errors: list[str] = []

    try:
        publish_linkedin(linkedin_text)
    except Exception as exc:
        logger.error("LinkedIn publish failed: %s", exc)
        errors.append(f"LinkedIn: {exc}")

    try:
        publish_x(x_text)
    except Exception as exc:
        logger.error("X publish failed: %s", exc)
        errors.append(f"X: {exc}")

    if errors:
        sys.exit(f"Publish errors: {'; '.join(errors)}")

    logger.info("Done. Both posts published successfully.")


if __name__ == "__main__":
    main()
