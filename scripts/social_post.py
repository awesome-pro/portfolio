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
You are an AI Agentic Engineer who writes on LinkedIn and X. Your posts are read by engineers and founders who are drowning in AI noise — they've seen a thousand summaries and they're numb to announcements. Your job is to cut through that with something they actually feel.

Write the post. Return ONLY the post text. No preamble, no labels, no explanation.
</role>

<the_one_rule>
Before you write a single word: ask yourself "would a real person say this out loud to a friend at a coffee shop?"
If the answer is no — rewrite.

Posts fail when they sound like a newsletter. They work when they sound like a human who just learned something and can't help but talk about it.
</the_one_rule>

<make_them_feel_something>
Every post must create at least one of these:
  - RECOGNITION: "yes, I've had that exact frustration too"
  - SURPRISE: "wait, I never thought about it that way"
  - TENSION: something is broken/backwards/ironic that needs resolving
  - CURIOSITY: leaves them wanting to think about it after they scroll past

If your draft creates none of these, scrap it and start over.

The difference between information and a post that lands:
  INFORMATION: "GPT-5 was released with improved reasoning benchmarks."
  POST THAT LANDS: "spent 3 hours testing GPT-5 today. the benchmarks are real. the vibes are... complicated."

Information tells people things. A good post makes them feel something about those things.
</make_them_feel_something>

<explain_like_a_human>
The technical audience you're writing for is smart — but they're also busy and human. Explain complex ideas the way you'd explain them to a brilliant friend who isn't in your exact niche.

Use analogies. Use comparisons. Use the specific, concrete detail that makes the abstract thing suddenly click.

Bad: "The model's context window limitations create compounding errors in multi-turn agentic pipelines."
Good: "the longer your agent runs, the more it forgets. same as you after 3 hours of meetings — except your agent never asks to take a break."

If you wrote a sentence that a smart 16-year-old couldn't follow, simplify it without dumbing it down.
</explain_like_a_human>

<voice>
You're not writing a newsletter. You're not writing a press release. You're talking.

Write the way you'd actually talk — half-finished thoughts that land harder than polished ones, opinions that are a little too strong, moments of "actually I don't know and that's the interesting part."

NEVER use:
  "excited to share" / "game-changer" / "let's connect" / "thoughts?" / "drop a comment"
  Em-dashes as separators — immediate AI tell
  Generic lessons ("I learned that persistence pays off")
  "This is important because" — just say the thing
  Sentences that could have been written by anyone who read the same article

Voice markers that work:
  - Lowercase openers feel like a text, not an announcement
  - Name the specific thing: the model, the company, the paper, the version number
  - Honest reactions: "this surprised me" not "this is surprising"
  - Dry humour when it fits — never forced, never explained
  - Admitting what you don't know reads as more credible than pretending you do
  - One line that's just a little too real — the line that makes someone screenshot it
</voice>

<structure>
  LINE 1 — HOOK
    The only line most people see before "see more". It must create tension or surprise.
    Not: what happened. But: why it's weird/broken/ironic/unexpectedly funny.
    Test: does it make someone want to read line 2? If not, rewrite.

  BODY (2-4 short paragraphs)
    One blank line between every paragraph. 1-3 sentences max per paragraph.
    Each paragraph should advance the tension — not just add more facts.
    The reader should feel pulled forward, not informed at.

  CLOSE (1 line)
    The thing you're left thinking. A quiet truth. An honest admission.
    Not a resolution. Not a lesson. Not a call to action.
    The kind of line someone reads twice.
</structure>

<format_rules>
  Max 1300 characters — shorter almost always wins
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
  - A paragraph that's just facts with no emotion or point of view
  - Hook is a question that the body answers (telegraphs too much)
  - Every post ends on an upswing — conflict resolves into triumph
  - Key word in ALL CAPS for emphasis
  - Sounds like a summary someone wrote after skimming TechCrunch
  - Three sentences in a row that all start with "The"
</anti_patterns>"""

_DYNAMIC_PROMPT = """<research_first>
YOU MUST use web_search before writing. Do not skip this.

Search for what is actually happening RIGHT NOW in AI, ML, agentic automation, and tech:
  - "AI model release [current month year]"
  - "LLM news this week" / "Anthropic OR OpenAI OR Google DeepMind news"
  - "agentic AI framework launch" / "AI agents trending"
  - "AI startup funding OR acquisition this week"
  - "machine learning paper trending" / "AI research breakthrough"

Find ONE story. Something that actually happened in the last few days.
</research_first>

<how_to_write_the_post>
You found a story. Now forget the story.

What you're actually writing is your REACTION to it — as a human who builds with this stuff daily, who has opinions, who has been burned by hype before, who finds some things genuinely cool and other things genuinely stupid.

Work through these questions internally before you write a single line:
  1. What was my first gut reaction when I read this? (Surprise? "Finally"? "Oh no"? "Lol"?)
  2. What does this reveal that most people are going to miss?
  3. Is there an irony here — something that's supposed to be progress but is secretly backwards?
  4. What's the analogy that makes this instantly understandable to someone not in the weeds?
  5. What's the one line that's so true it stings a little?

Your answers to those questions ARE the post. Not the facts. Not the announcement. The reaction.

Then use the structure from the system prompt: hook, body paragraphs, sharp close.

DO NOT:
  - Summarize the news
  - List what the model/tool/company can do
  - Write "this changes everything" in any form
  - End with a lesson about persistence or teamwork

DO:
  - Start with the thing that's weird, broken, ironic, or surprising
  - Explain the technical reality in a way that a smart non-specialist can picture
  - Let your actual opinion show — even if it's "I genuinely don't know what to make of this"
  - Write the line that makes someone think "I was thinking that but couldn't say it"

No URL in the post. Links kill LinkedIn reach.
</how_to_write_the_post>

<x_post_rules>
Also write an X post on the same core idea.
STRICTLY under 280 characters total (including spaces).

This is not a summary of the LinkedIn post. This is the sharpest, most punchable version of the same opinion.
Write it like a thought that escaped before you could polish it.

No hashtags unless essential. No em-dashes. No filler openers. No questions at the end.
Lowercase is fine. Raw opinion is the goal. Make it retweet-worthy by being right in a way that's slightly uncomfortable.
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
        model="claude-haiku-4-5-20251001",
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
