-- seed_opportunity_signals: idempotent target-company seed.
--
-- Safe to run repeatedly: `on conflict (company_name) do nothing` means an
-- existing row is never touched (your notes / status / links always win).
-- Only rows that are genuinely missing get inserted.
--
-- Companies already in the live table are included on purpose, so this file
-- doubles as the complete target list rather than a diff.

begin;

insert into public.opportunity_signals (company_name, website, notes) values
  -- Inference and serving
  ('Together AI',          'https://www.together.ai/',       'Inference & serving'),
  ('Fireworks AI',         'https://fireworks.ai/',          'Inference & serving'),
  ('Baseten',              'https://www.baseten.co/',        'Inference & serving'),
  ('Modal',                'https://modal.com/',             'Inference & serving'),
  ('Groq',                 'https://groq.com/',              'Inference & serving · LPU'),
  ('Cerebras',             'https://www.cerebras.ai/',       'Inference & serving · wafer-scale'),
  ('Replicate',            'https://replicate.com/',         'Inference & serving'),
  ('DeepInfra',            'https://deepinfra.com/',         'Inference & serving'),
  ('Prime Intellect',      'https://www.primeintellect.ai/', 'Inference & serving · decentralised training'),
  ('Hugging Face',         'https://huggingface.co/',        'Inference & serving · TGI'),
  ('Anyscale',             'https://www.anyscale.com/',      'Inference & serving · Ray Serve'),
  ('Databricks',           'https://www.databricks.com/',    'Inference & serving · Mosaic / model serving'),

  -- Labs and frontier labs
  ('NVIDIA',               'https://www.nvidia.com/en-us/',  'Labs & frontier · inference stack'),
  ('OpenAI',               'https://openai.com/',            'Labs & frontier'),
  ('Anthropic',            'https://www.anthropic.com/',     'Labs & frontier'),
  ('xAI',                  'https://x.ai/',                  'Labs & frontier'),
  ('Mistral',              'https://mistral.ai/',            'Labs & frontier'),
  ('Cohere',               'https://cohere.com/',            'Labs & frontier · enterprise RAG'),
  ('Inferact',             'https://inferact.ai/',           'Labs & frontier · vLLM-origin team'),

  -- Agents, browser and coding
  ('Browserbase',          'https://www.browserbase.com/',   'Agents & browser · headless browser infra'),
  ('Browser Use',          'https://browser-use.com/',       'Agents & browser'),
  ('Cursor',               'https://cursor.com/',            'Agents & coding'),
  ('Cognition',            'https://cognition.ai/',          'Agents & coding · Devin, Windsurf'),
  ('Perplexity',           'https://www.perplexity.ai/',     'Agents & search'),

  -- Voice
  ('ElevenLabs',           'https://elevenlabs.io/',         'Voice AI'),
  ('Skit.ai',              'https://skit.ai/',               'Voice AI · India'),

  -- RAG, search and enterprise
  ('LangChain',            'https://www.langchain.com/',     'RAG & orchestration · LangChain, LangSmith'),
  ('LlamaIndex',           'https://www.llamaindex.ai/',     'RAG & orchestration'),
  ('Sierra',               'https://sierra.ai/',             'Enterprise agents · CX'),
  ('Decagon',              'https://decagon.ai/',            'Enterprise agents · CX'),
  ('Glean',                'https://www.glean.com/',         'Enterprise search'),
  ('Harvey',               'https://www.harvey.ai/',         'Enterprise AI · legal'),
  ('Hebbia',               'https://www.hebbia.com/',        'Enterprise AI · document analysis'),
  ('Notion',               'https://www.notion.so/',         'Enterprise AI · workspace'),
  ('Clay',                 'https://www.clay.com/',          'Enterprise AI · GTM'),

  -- India
  ('Sarvam AI',            'https://www.sarvam.ai/',         'India · sovereign LLMs'),
  ('Krutrim (Ola)',        'https://www.olakrutrim.com/',    'India · sovereign LLMs'),
  ('Yellow.ai',            'https://yellow.ai/',             'India · conversational AI'),
  ('AI4Bharat',            'https://ai4bharat.iitm.ac.in/',  'India · open Indic models'),
  ('Razorpay',             'https://razorpay.com/',          'India · fintech'),
  ('PhonePe',              'https://www.phonepe.com/',       'India · fintech'),
  ('CRED',                 'https://cred.club/',             'India · fintech'),
  ('Flipkart',             'https://www.flipkart.com/',      'India · commerce'),
  ('Swiggy',               'https://www.swiggy.com/',        'India · commerce')
on conflict (company_name) do nothing;

commit;

-- Verification: count of rows after seeding.
select count(*) as total_signals from public.opportunity_signals;
