import LLM_API_Utils from '../popup/llm_api_utils.js';
import fs from 'fs';

// Sample processed transcripts with toggle flags
export const TRANSCRIPTS = {
  memecoinInterview: {
    enabled: true,
    content: `

*** Background Context ***
Title: Make Generational Wealth with Memecoins w/ Murad
Description: Today I have the great Murad on my channel to discuss the Memecoin Supercycle. Why it's happening, and why it will continue.

*** Transcript ***
[22:02 -> 22:44]  
Speaker 1:  
Speaking of meme coins, I always try to analogize what’s happening now with the past because it helps me rationalize things. Someone shared this tweet—it’s from August 10, 2020. Binance was listing YFI, and people were making spreadsheets of all the DeFi tokens being listed during DeFi Summer. DeFi Summer was insane. I have a feeling that the meme coin cycle we’re in now is going to be the equivalent of DeFi Summer. Coinbase listed Pepe, and Robinhood is relisting Solana right after delisting it at the lows, along with other meme coins.

[22:46 -> 22:55]  
Host:  
What do you think the effects are? Obviously, these big centralized exchanges (CEXs) are listing meme coins. What do you think that means for the trenches? Do you think that's going to create some massive wealth effect? What are your thoughts there?  

[22:57 -> 23:16]  
Murad:  
Yeah, I mean, CEX listings are important because there are still a lot of people around the world who are using centralized exchanges and not interacting directly with the blockchain. The way you should see it is that it simply adds to distribution and liquidity. So, they remain a very important part of the overall formula.  

[23:17 -> 23:30]  
Host:  
Got it, got it. I’m going to ask you about your meme coin picks later, but this is an audience question. Mr. Smile Dan says, "I think you post a lot of inspirational videos on your Twitter. I just love them—I like all of them."  

[23:31 -> 23:44]  
Host:  
He also mentioned that you’ve said people who work really hard and lock in during 2025 will be rewarded in 2026. Obviously, you’ve mentioned that your meme coin picks are already finalized or 90% finalized. So, what are you doing now? Are you just locked in, managing the community in Telegram chats? What’s your focus nowadays?  

[23:56 -> 24:18]  
Murad:  
Yeah, so, I actually tweeted about this earlier today. I said there are two ways to make it or survive in this space. One is hyper-gambling on-chain, and the other is finding hardcore communities of believers. This aligns with my overall thesis that the meme coin asset class has two subcategories: short-term gambling and long-term community building.  

[24:19 -> 24:31]  
Murad:  
The latter is about trying to build the next Dogecoin, and that’s where my interest lies. It’s all about community building—whether through artwork, media growth, TikTok, Instagram, YouTube, giveaways, competitions, Twitter engagement, or anything in between.  

[24:32 -> 24:48]  
Host:  
Got it. So, I guess you’re just locked in. I’ve also been looking into meme coins. Of course, you have your picks, but you’ve mentioned there’s room for hundreds of billion-dollar meme coins.  

[24:49 -> 25:07]  
Host:  
You’ve also said that to make generational wealth, you need to identify the cults—the strong communities, mission-driven coins, and so on. Another audience question is: How does one go about researching these cults? Is there a specific method or approach you use to identify them?  

[25:08 -> 25:26]  
Host:  
What do you need to see to recognize a new cult forming? Because while you’ve already identified some, I’m sure there will be new ones. What characteristics should people look out for?  

[25:28 -> 25:56]  
Murad:  
For me personally, I only look at projects that are at least three months old. You could be a bit more aggressive and lower that threshold to two or even one month, but it’s not something that just launched today. You need some time to allow a cult-like following to form.  

[25:57 -> 26:17]  
Murad:  
In my experience, it takes around seven to eight months for something to truly deserve being called a cult in this context. This is also why I believe most of the major cults have already been created. If you agree with me—or if I’m right—that we only have about a year left in this cycle, there’s only so much time left for new ones to take off.

[26:20 -> 26:49]  
Murad:  
To exist in terms of time, you want to see two or three dips that are around 70% or more. What that does is it flushes away the so-called "non-believers," leaving behind the believers—those who stay, those who buy more, and those who are truly committed. That’s exactly the kind of demographic you want during future pumps if you want to succeed. These people are not going to sell, even for a 100x return.  

[26:49 -> 27:50]  
Murad:  
On-chain, there are so many metrics you can analyze: diamond-handedness ratios, average time held, decentralization, and various forms of distribution. You can use tools like the Gini coefficient or the HHI coefficient to assess these. You can also look at the average investment per wallet. Intuitively, you’ll start to grasp what I call "cults." These communities rank very highly on many of these metrics.  

On the subjective side, for me personally, I need to resonate with the artwork, the videos, and the people involved. There has to be a unique vibe in the Telegram or Discord chats. Combining all of these factors together is how you build a complete picture.  

[27:50 -> 28:07]  
Host:  
Hey, TYI here. If you're enjoying the content, please like and subscribe. I don’t run YouTube ads or have sponsors on this channel, so I’d really appreciate your support. Your engagement helps this video reach more people, which allows me to book better guests in the future. Now, back to the episode.  

[28:07 -> 28:30]  
Host:  
A couple of months ago, you shared your top 10 picks for this cycle and mentioned that you’re sticking with them. First of all, I really applaud you for being so transparent—having a public list, making your wallet public, and committing to a social contract not to sell.  

But I do have a question. The memecoin space and the broader crypto markets are evolving rapidly. The metas from three months ago might not be the metas now. Why did you decide to make your picks so early?  

[28:30 -> 29:03]  
Host:  
It seems like it would be hard for you to change your mind now. If you wanted to add a new coin to the list, what would you do? Do you think you’re able to add coins to the list? If you feel you’re wrong about a particular coin, is it possible for you to sell and replace it with another? Have you thought about this? It’s something that’s been on my mind, and I’d love to hear your perspective.  

[29:03 -> 29:58]  
Murad:  
The crypto markets are definitely evolving from cycle to cycle. But if you study past cycles, the big winners tend to run for over a year, sometimes even two years in a row.  

First of all, I think you’d agree that this is a memecoin cycle. Sure, there will be different memecoin metas, but one critical factor remains constant: there needs to be a very, very passionate community behind it. That’s non-negotiable.  

I’m sure there will be runners that I’ll miss, and I’m totally fine with that. For me, I know from past cycles that the people who succeeded in crypto were those who bought...

[30:02 -> 30:20]  
Murad:  
Coins, and they held them for a year, even two years, right? That’s what I’ve decided to do with my portfolio. Even after all the recent metas, I still think my coins are going to end up being some of the biggest, and I’m sticking to that. I’m sticking to that opinion right now.  

[30:20 -> 30:47]  
Interviewer:  
You know, I guess one trait of a good investor, as SL Trader says, is the ability to change your mind, right? Are you open to selling one of these tokens at some point if the thesis is invalidated, for whatever reason? Or are you saying, “These are my final picks, and I’m not going to change my mind. I’m not selling any until Q4 of 2025,” regardless of whether their price performance is strong or weak?  

[30:47 -> 31:02]  
Murad:  
I’m not selling any until Q4 of 2025, regardless of whether their price performance is strong or weak.  

[31:02 -> 31:10]  
Interviewer:  
Got it. Okay, I respect that. Are you open to adding more coins to your list, or is that something you’re not considering?  

[31:10 -> 31:37]  
Murad:  
I might add one or two, but I want to be extremely conservative. My whole strategy and philosophy is to not jump from thing to thing. I don’t want to be, quote-unquote, “calling new coins” every week or every two weeks. I think it’s much more valuable to stay loyal to your existing picks.  

[31:37 -> 31:57]  
Murad:  
Why? Because I believe what people actually want is safety, not gambling. The more coins you call, the more you diminish that sense of safety. You have to be selective in terms of your holdings and beliefs. For me, I’d rather pursue what you might call a “tight-aggressive strategy” in poker. Think of it as measuring 100 times and picking once. I’m very comfortable with my existing picks, and I’m sticking to them for now.  

[31:57 -> 32:18]  
Interviewer:  
Got it. Okay, so you’re open to maybe one or two, but probably not more because you don’t want to be jumping the gun or chasing trends. Obviously, I have to mention the ticker and whatnot, but would you be open to, let’s say, AI memes?  

[32:18 -> 32:41]  
Interviewer:  
This is the meta I’ve been embracing. GOAT was the reason I completely got out of the mid-curve—or at least I’m trying to get out of the mid-curve. You haven’t really spoken about it. You did mention that you’re interested in it, but the time component is what you’re a little concerned about. It hasn’t been tested because it’s been “up only.” Are you open to identifying a potential AI coin within the AI meta? Do you have any thoughts on whether this has any legs?  

[32:41 -> 33:19]  
Murad:  
A couple of things. First of all, my whole strategy—and if you notice all of my past ten picks—is that I like to buy things that have been out there for at least several months. Frankly, the longer, the better, because then I can see that a significant amount of time has passed, and the community is still thriving.  

[33:19 -> 33:36]  
Murad:  
The second thing is, I only ever buy during big dips. I never buy during rips. I only buy during significant downturns.

[33:38 -> 37:35]  
Murad:  
With that strategy, you're going to miss a lot of runners, but you're also not going to be buying tops. For me, that approach has worked quite well so far. I don't like to buy something that's been "up only." I prefer to buy things when people have temporarily forgotten about them.  

The third point I want to make—and I'm not here to argue against your thesis, but rather to present my own—is that it's undeniable AI will continue improving in the coming years. It's going to make exponential strides. However, the issue is that, over the last two years, we've seen the cost—in terms of time, skill, and labor—of creating a large codebase collapse very quickly.  

What I believe we’ll see is that defensible moats in anything technological, particularly in the crypto sphere, are going to diminish to zero. Why? Because if it's open source—even if you're not a scam project and are producing legitimate revenues—a lot of the current fees will no longer be viable. Thousands of people will be creating open-source codebases that are cheaper or even completely free. These will be battle-tested, forked repeatedly, and even AI agents will be testing and refining the code.  

Initially, the vision for blockchain was to build a world without middlemen. My belief is that the long-term future is one where all blockchain-related things should be free, almost free, or at least at cost. Slowly but surely, I think that's the direction the world is heading.  

Now, you have to ask yourself: what is valuable in a world where AI is everywhere? My belief is that, over the next 50 years, the things that will be at a premium will actually be biological. Outside of crypto, this includes fitness, health, community gatherings, and social events. Inside of crypto, this is why I'm bullish on BTC and cult memecoins. Their value proposition isn't technological; it's based on community, belief, faith, and, to some extent, liquidity and Lindy effects.  

The problem with tech—whether it's AI or traditional tech—is that every few months, there's always going to be something shinier, faster, better, or more advanced. This constant innovation makes it difficult to develop a consistent sense of safety or trust. For new projects starting from scratch, integrating the latest technology is easier than it is for an established project to overhaul its entire spaghetti codebase overnight.  

That's why so many alternative Layer 1s from the previous cycle are no longer being talked about. There's always a new, shinier thing every three years.

[37:37 -> 37:43]  
Murad:  
From now, there's going to be another shinier thing, and so on and so forth. Maybe that happens with AI memes, maybe not.  

[37:43 -> 37:57]  
Murad:  
But, you know, we're already seeing that we started with AI memes that were just like a pump for fun, initiated by some guy. Then we had AI memes where the AI itself created a pump.  

[37:57 -> 38:02]  
Murad:  
Now, we even have wallets that are autonomously controlled. You see, there's always this chain of upgrades.  

[38:02 -> 38:16]  
Murad:  
When they release GPT-4 or GPT-5, one of the OpenAI or Anthropic employees—or whoever—might go and create some other coin. Who knows? I'm just speculating here.  

[38:16 -> 38:24]  
Murad:  
But there's always that sense of insecurity. My belief is that cult meme coins—the non-gambling-focused ones—have a value proposition rooted in finding security in the digital world.  

[38:24 -> 38:38]  
Murad:  
This security comes from groups of people. I don't know how strong these AI communities are, but personally, I don't really know how to "meme" them. Are they really meme coins?  

[38:38 -> 38:53]  
Murad:  
I would say they're more like AI agent coins. They're something completely different. I mean, I can maybe meme something like "Apu" or "Popcat" to my grandma, but I don't know how I would meme the "Z Bros" or "Goats" of the world.  

[38:53 -> 39:13]  
Murad:  
At least with dog coins, it's like, "Oh yeah, it's a cute dog." But with an AI agent coin, you have to explain it. Maybe it's like a mid-curve way of thinking.  

[39:13 -> 39:23]  
Host:  
Yeah, exactly. I think DeFi people love the AI coins.  

`
  },
  // Add more transcripts here like:
  otherInterview: {
    enabled: false,
    content: `
    // Your other transcript content
    `
  }
};

describe('LLM Highlight Extraction Tests', () => {
  const llmUtils = new LLM_API_Utils();
  const MODEL_NAME = 'chatgpt-4o-latest';
  // const MODEL_NAME = 'gpt-4o-mini';


  // Test different prompt variations to find the most effective one
  const PROMPT_VARIATIONS = [
    {
      name: 'Growth Hacker Format',
      prompt: `Extract content optimized for maximum social media engagement. 
      
      Identify moments that are:
      - Highly quotable
      - Contrarian/surprising
      - Data-driven
      - Actionable
      - Story-driven
      
      Format each highlight as:
      [XX:XX -> YY:YY]
      
      💎 HIGHLIGHT: Brief attention-grabbing hook
      📝 CONTEXT: Key supporting details
      🎯 TAKEAWAY: Why this matters
      
      Make each section punchy and shareable. Focus on insights that would make people want to follow for more.
      
      
      `
    },
    {
      name: 'Deep Dive Technical Insights',
      prompt: `Extract segments where the speaker delves into technical details or provides expert analysis on complex topics.

Look for:
- In-depth explanations of concepts
- Technical tutorials or walkthroughs
- Advanced strategies or methodologies
- Clarification of common misconceptions

Format each highlight as:
[Timestamp]
🔬 Topic: Brief title
🧠 Insight: Summary of the explanation or analysis


`
    },
    {
      name: 'Controversial Opinions and Debates',
      prompt: `Highlight moments where the speaker expresses a controversial opinion, challenges conventional wisdom, or engages in a debate.

Focus on:
- Unpopular or bold statements
- Critiques of mainstream ideas
- Provocative questions posed
- Counterarguments to common beliefs

Format each highlight as:
[Timestamp]
⚡️ Controversial Point: One-line summary
💬 Explanation: Supporting arguments in 1-2 sentences


`
    },
    {
      name: 'Inspirational Quotes and Philosophy',
      prompt: `Find powerful quotes, philosophical reflections, or motivational statements made by the speaker that could inspire the audience.

Look for:
- Memorable one-liners
- Philosophical insights
- Motivational affirmations
- Ethical considerations

Format each highlight as:
[Timestamp]
✨ Quote: "Exact words from the speaker"
🌟 Reflection: Brief explanation or context
`
    },
    {
      name: 'Hook And Retain Insights',
      prompt: `You are an expert content curator focused on extracting high-value insights that crypto/tech professionals would immediately stop scrolling for.

Focus on moments that are:
- Contrarian or surprising alpha
- Data-backed insights
- Strategic frameworks
- Industry-shifting predictions

For each highlight:
[XX:XX -> YY:YY]
🔥 HOOK: One-line attention grab (prioritize surprising/contrarian elements)
💎 ALPHA: Key insight or prediction (2-3 bullet points max)
🎯 WHY IT MATTERS: Single line on strategic importance

Rules:
- Lead with the most surprising/valuable element
- Keep everything concise and punchy
- Focus on source insights over commentary
- Only include truly high-signal moments
- Write for sophisticated traders/builders who want an edge

Aim to make each highlight feel like discovering insider knowledge.`
    },
  ];

  beforeAll(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = `llm_highlight_prompt_optionization_${timestamp}.md`;
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const log = (message) => {
      console.log(message);
      logStream.write(message + '\n');
    };

    log('\nHighlight Extraction Comparison Results');
    log('=====================================\n');

    const startTime = Date.now();
    try {
      // Process each enabled transcript
      for (const [transcriptName, transcriptData] of Object.entries(TRANSCRIPTS)) {
        if (!transcriptData.enabled) continue;

        log(`\nProcessing transcript: ${transcriptName}`);
        log('----------------------------------------');

        // Run all prompt variations for this transcript
        const results = await Promise.all(PROMPT_VARIATIONS.map(async ({ name, prompt }) => {
          try {
            const extractedHighlights = await llmUtils.processTranscriptInParallel({
              transcript: transcriptData.content,
              model_name: MODEL_NAME,
              partitions: 1,
              system_role: prompt
            });
        
            return {
              name: name,
              system_role: prompt,
              success: true,
              highlights: extractedHighlights
            };
          } catch (error) {
            return {
              name,
              success: false,
              error: error
            };
          }
        }));

        // Log results for each prompt variation
        for (const result of results) {
          log(`\nResults for "${result.name}" prompt variation...`);
          log(`\system_role used:`);
          log(`${result.system_role}`); 
          log('----------------------------------------');

          if (result.success) {
            log('\nExtracted Highlights:');
            log(result.highlights);
            log('\nMetrics:');
            log(`- Highlight count: ${result.highlights.split('\n').filter(line => line.trim()).length}`);
          } else {
            log('\nError occurred during processing:');
            log(`- Prompt variation: "${result.name}"`);
            log(`- Error message: ${result.error.message}`);
            log(`- Stack trace: ${result.error.stack}`);
          }
          log('\n----------------------------------------');
        }
      }

      const endTime = Date.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);
      log(`\nTotal processing time for all variations: ${totalTime} seconds`);
    } catch (error) {
      log('\nFatal error occurred:');
      log(`- Error message: ${error.message}`);
      log(`- Stack trace: ${error.stack}`);
    }

    logStream.end();
  }, 600000);

  test('Placeholder test to satisfy jest', () => {
    expect(true).toBe(true);
  });
});