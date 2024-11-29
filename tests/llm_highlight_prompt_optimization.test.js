import LLM_API_Utils from '../popup/llm_api_utils.js';
import fs from 'fs';

// Sample processed transcripts with toggle flags
export const TRANSCRIPTS = {
  memecoinInterview: {
    enabled: false,
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
    enabled: true,
    content: `
    *** Background Context ***
Title: "We're in a TikTok gold rush" - 5 Business Ideas To Start Before 2025
Description: Get the guide to spot market opportunity 👉 https://clickhubspot.com/bwn

*** Transcript ***
[00:00 -> 00:16]  
Speaker 1:  
All right, Sam, in the next hour, I am going to flood you with business ideas. I’m going to create an absolute lunchroom food fight, slinging business ideas at you. You are going to be drenched and covered with ideas. Are you prepared?  

[00:23 -> 00:30]  
Speaker 2:  
That’s a great analogy—the lunchroom one. Did you just come up with that?  

[00:30 -> 00:38]  
Speaker 1:  
Yeah, that was very good. By the way, all of these ideas are very half-baked. I’d say 75% of them came to me this morning because we had a guest cancel. We decided to record anyway, and I thought, “How about we do some business ideas? Let’s give the people what they want.” It’s the season of giving, and we’re going to give the people what they want: fun business ideas.  

[00:38 -> 00:48]  
Speaker 2:  
Well, the first one—you actually have a lot of intel on this, right? You actually use this.  

[00:48 -> 01:03]  
Speaker 1:  
The first one? I have some bets. I have some bets on horses, and those horses are currently paying out. I haven’t been talking too much about it, but I think it’s time. So, TikTok. Let’s talk about TikTok.  

[01:03 -> 01:20]  
Speaker 1:  
TikTok right now—if you open up your phone, do you have TikTok on your phone?  

[01:12 -> 01:13]  
Speaker 2:  
No.  

[01:13 -> 01:22]  
Speaker 1:  
Okay. For some of you, you might have trouble opening the app because there might just be millions of dollars jammed in there. It’s a little stuck. It might be hard to open because there’s so much money available on TikTok right now.  

[01:22 -> 01:27]  
Speaker 1:  
Do you use TikTok as a user?  

[01:27 -> 01:30]  
Speaker 2:  
Of course. I’m a TikTok addict.  

[01:30 -> 01:33]  
Speaker 1:  
Oh, that’s why I don’t use it. I had it, and I deleted it.  

[01:33 -> 01:39]  
Speaker 2:  
I love TikTok. I have a lot of fun on it, but I also have a couple of business bets that are doing really well in this space. I think people are sleeping on it right now.  

[01:39 -> 01:43]  
Speaker 1:  
When you say business bets, do you mean things that you own or investments in other people?  

[01:43 -> 01:48]  
Speaker 2:  
I own equity in companies that are doing this.  

[01:48 -> 01:50]  
Speaker 1:  
That’s what I’m asking.  

[01:50 -> 01:53]  
Speaker 2:  
So, you’re asking if I invested in companies doing this—not something I fully own or operate?  

[01:53 -> 01:55]  
Speaker 1:  
Correct.  

[01:55 -> 01:57]  
Speaker 2:  
I’m trying not to operate anything at this point.  

[01:57 -> 02:00]  
Speaker 1:  
Yeah, because that insight is a little bit different.  

[02:00 -> 02:19]  
Speaker 2:  
Yeah, but these are all somewhere in between. There’s angel investing, where you write a check and are sort of passive—you’re on the outside. I’d say you’re on the other side of the fence, and they lob updates over to you. Then there are situations where you own 10%, 20%, 30%, or 40% of the company, and you’re more actively involved. You’re not active day-to-day with your hands, but you’re active with your ears and your mouth.  

[02:19 -> 02:23]  
Speaker 1:  
All right. So, anyway, TikTok today is a little bit like Facebook was from 2012 to 2014.  

[02:23 -> 02:31]  
Speaker 1:  
If you remember, at that time, you were working at a place called Founders Dojo. There was a guy there named Mo Ali.  

[02:31 -> 02:39]  
Speaker 2:  
Yeah, Mo Ali. Today, he’s more famous because he started a brand called Native Deodorant.  

[02:39 -> 02:45]  
Speaker 1:  
Do you want to give a quick summary of what it was like being at Founders Dojo when he was creating Native?  

[02:45 -> 03:02]  
Speaker 2:  
Basically, Mo was this guy who went to Harvard—Harvard Law, I think. So, he was clearly smart. He had a small e-commerce startup that he sold for around $4 million. Very promising, but still young and figuring out his next move.  

[03:02 -> 03:08]  
Speaker 2:  
At Founders Dojo, which was my little 10-person office that I shared with some other guys, he was looking for something to sell. He considered mattresses and a few other things before landing on deodorant.  

[03:08 -> 03:19]  
Speaker 2:  
Right in front of us, literally every day, he learned how to use Facebook ads. In a very short amount of time, he scaled his deodorant business from just an idea to $30–40 million in revenue in about 18 months.  

[03:19 -> 03:27]  
Speaker 1:  
And eventually, he sold it for $100 million in cash in just 24 months.  

[03:27 -> 03:31]  
Speaker 2:  
Yeah, two and a half years, start to finish. From the time he started to the time he exited, $100 million—sold to Procter & Gamble.  

[03:31 -> 03:36]  
Speaker 1:  
So, why did he succeed? One, he picked an interesting category. But more importantly, he was doing something that not a lot of other smart, Harvard-graduate-type people were doing.  

[03:36 -> 03:52]  
Speaker 1:  
At that time, on Facebook, you could get traffic and sales for very cheap. He was able to build a consumer base at the right place and the right time.

[03:54 -> 07:37]  
Speaker 1:  
Basically, by the way, I saw his sheet. We wrote an article on it, and he sent it to me. I think he was spending $4, and each customer he spent $4 to acquire was then spending $16 with him. I believe those were the numbers. So, it was like a money-making machine.  

Speaker 2:  
Okay, yeah, I'm not sure about the exact math, but it was something like that—sort of like a four-to-one, five-to-one, or six-to-one payout on every dollar.  

Speaker 1:  
Right, which is very hard to achieve today. Nowadays, 1.5 is the new four-to-one.  

Speaker 2:  
Exactly. So basically, you put in a dollar, and you get $1.50. That same machine used to give you $4 for every dollar.  

Speaker 1:  
Man, those were the good old days.  

Speaker 2:  
Well, the good old days are happening right now on TikTok.  

Speaker 1:  
So, what's actually happening? Here's the breakdown of how this works. You create a product—whatever type, digital or physical. Great product. Now, I want you to look at something. Go down on our sheet.  

Speaker 2:  
Okay.  

Speaker 1:  
On page four, there's an infographic from a brand called Goli. You know what Goli is?  

Speaker 2:  
Yeah, it's apple cider vinegar gummies.  

Speaker 1:  
Exactly. They sell gummies—gummy vitamins—but specifically apple cider vinegar (ACV), which was part of a health and wellness trend. Now, Goli... Dude, first of all, you can put anything in a gummy.  

Speaker 2:  
Yeah, it started with weed gummies, right?  

Speaker 1:  
Exactly. Then I started doing creatine that way. Now, they've done the last thing I thought you could possibly do in a gummy—vinegar.  

Speaker 2:  
Yeah, yeah. And if you drink apple cider vinegar, it tastes horrible. But the Goli gummies taste great. It's like apple cider vinegar without the pain.  

Speaker 1:  
Right. So, Goli itself was a business that grew like crazy—from zero to hundreds of millions in revenue. I think they ran into financial trouble, maybe bankruptcy or something like that. They got way ahead of their skis. The group that bought it has basically restarted it, and one of the main things they're doing is this TikTok creator method I’m talking about.  

Speaker 2:  
Okay, what’s the method?  

Speaker 1:  
Look at this infographic. This is a rewards program for TikTok creators. If you're a TikTok creator, not only do you get a little kickback on what you sell, but if you hit certain sales targets each month, you get rewards.  

Speaker 2:  
Like what?  

Speaker 1:  
So, low tier—$1,500 GMV (gross merchandise value)—you get an iPad. Cool, right? At $4,000 GMV, meaning you sell $4,000 worth of product, you get an iPhone.  

Speaker 2:  
Okay, that’s interesting.  

Speaker 1:  
It gets better. At $15,000 GMV, you get an all-inclusive trip to Aruba. At $50,000 GMV, you get a Rolex. And it stacks—you get the Aruba trip, the iPad, and the Rolex.  

Speaker 2:  
Wow.  

Speaker 1:  
Now, let’s go to the high tiers. There are people who have done a million dollars in GMV. They get a condo in Miami.  

Speaker 2:  
Wait, a condo?  

Speaker 1:  
Yes, if you hit a million dollars in GMV in a month, you get a condo in Miami. They’re going to creators and saying, “Hey, do you want this condo in Miami? It could be yours.”  

Speaker 2:  
That’s insane.  

Speaker 1:  
So, as a creator, you don’t even have to run a brand or service. You can just sit there and figure out how to sell apple cider vinegar gummies. And if you hit a million, they’ll give you a Lamborghini.  

Speaker 2:  
Oh my God.  

Speaker 1:  
And there are people who have achieved these targets. This is their program right now.  

Speaker 2:  
So, this is who you’re competing against if you’re trying to recruit creators?  

Speaker 1:  
Exactly. It’s like being a Division I college basketball program trying to recruit McDonald’s All-Americans. There are creators out there—like this kid in Wichita—who are creative geniuses. They sit in their bedrooms and figure out the best hooks and angles. Brands are putting them on retainer for $10,000, $20,000, or even $30,000 a month just to create content for them.  

Speaker 2:  
That’s wild.  

Speaker 1:  
It’s what’s happening right now in the creator space.  

Speaker 2:  
How many views do the big videos get?  

Speaker 1:  
Millions. Tens of millions of views. They can get a million likes on a video.  

Speaker 2:  
A million likes?  

Speaker 1:  
Yeah, if you get a million likes, you probably had five or six million views.  

Speaker 2:  
That’s crazy.  

Speaker 1:  
Right? There’s this guy dressed up in scrubs talking about it. I have no idea if he actually works in the medical industry, but because he’s wearing scrubs, I’m like, “All right, what do you got?”

[07:38 -> 08:19]  
Speaker 1:  
All right, my friends. A lot of you listen to this show because you want to start a company, but you're not sure what idea to choose—or maybe you don’t even have an idea yet. You like our podcast, *My First Million*, because we’ve done a lot of the work for you by researching all these business ideas.  

Well, we’ve made life even easier for you. HubSpot has put together an entire list of resources you can use to find a market opportunity and validate your next business idea. If you’re looking for a market size calculator, tools to identify market trends, or a huge list of ideas to get started, there’s a link below. Click it, and you’ll have access to the whole thing—it’s completely free.  

Now, back to the show.  

[08:22 -> 08:46]  
Speaker 2:  
Okay, so Goli did this. Gurunanda teeth whitening—are you familiar with this?  

Speaker 1:  
I think the teeth whitening space is full of scammers. I’m not saying you’re a scammer for using TikTok Shop, but I think a lot of scammers use this platform in a certain way. So, it doesn’t surprise me that a teeth whitening company would be using it.  

Speaker 2:  
By the way, I’m not saying these guys are scammers at all, but you know what I mean.  

Speaker 1:  
Yeah, but I’m also not saying they’re not. No, no, no—I have no idea about this brand. But I’ve seen a lot of shady teeth whitening companies, and when I look into the research, I’m like, “Oh, this does nothing.”  

[08:47 -> 09:10]  
Speaker 2:  
I don’t know the effectiveness of any of these products. All I know is they’re selling a lot. I think the Gurunanda teeth whitening product is the number one selling product on all of TikTok. And TikTok is basically the most used app in the country right now.  

Speaker 1:  
So, you’ve got the top-selling product on the top platform. That’s pretty insane.  

[09:12 -> 09:34]  
Speaker 2:  
If they’re the top on TikTok, how much revenue do you think they’re doing?  

Speaker 1:  
I’ve tried to estimate this, but I don’t know the exact numbers. I don’t want to throw out a figure that’s way off.  

Speaker 2:  
Would it be crazy to say $5 million a month?  

Speaker 1:  
I don’t think that would be crazy.  

Speaker 2:  
Right. The brands doing this strategy well are doing really well.  

[09:36 -> 10:06]  
Speaker 1:  
This creates a halo effect. You sell products directly from one video, but then people hear about it. When they see an ad, it performs better because they’ve already heard about the product. They’ve seen 10 videos about it, so when you put a paid ad in front of them, those 10 organic impressions pay off.  

Or they search for it on Amazon. Amazon sees that signal and says, “Wow, people are really searching for this name. Maybe we should surface it higher.” Google does the same thing. It’s a multiplier effect.  

[10:09 -> 10:28]  
Speaker 2:  
I imagine this is fairly mainstream now because marketers are like piranhas. When there’s an opportunity, they all flock to it and eventually ruin it. So, how much life does this still have? How mainstream is this among brands?  

[10:30 -> 10:53]  
Speaker 1:  
Let’s say it’s in the red zone. It’s not as good as when I first discovered it, and I didn’t want to talk about it on the podcast because it was too good. When something is an absolute game-changer and feels like an unfair advantage, you want to keep it a secret.  

It’s not at that level anymore. However, it’s still at a point where you can do this today, and it would work. It’s just that you’re not the only one doing it anymore.  

[10:55 -> 11:14]  
Speaker 2:  
I have you and about 10 other friends in the e-commerce world. Every business has its challenges. With software, it’s churn. With e-commerce, the common complaints are cash flow and inventory.  

You’re talking about huge numbers—let’s say hypothetically $5 million a month, or $60 million a year. But is that actually a good business when you…?

[11:15 -> 11:32]  
Speaker 1:  
Is this something where you can actually make money doing this, or is it one of those things where even if you get big, you still end up broke?  

Speaker 2:  
Look, if you're bad at business, you'll find a way to lose money in any business. Even the goalie example I gave you—hundreds of millions of dollars, and they basically went bankrupt along the way. So, yes, there are ways to snatch defeat from the jaws of victory.  

[11:32 -> 11:43]  
Speaker 2:  
That said, there are also people who are absolutely printing money profitably with this. I've seen both examples. I don’t think it’s about the model; it’s about how well you actually run your business and how much common sense you apply.  

[11:43 -> 12:00]  
Speaker 2:  
One of the great things about this, from a cash flow perspective, is that in a normal e-commerce business, you put up the money for the ad and the capital is at risk to acquire users. With this model, you only put free product at risk. You send inventory to affiliates, they create the content, and you pay nothing for that ad until a sale is generated.  

[12:00 -> 12:05]  
Speaker 1:  
Dude, so if you’re selling a digital product, you’d crush it here.  

Speaker 2:  
Exactly.  

[12:05 -> 12:11]  
Speaker 2:  
I have a couple of examples of digital products as well in my list. Okay, here we go. That was a long setup for five ideas that I think you could take to TikTok and absolutely crush right now.  

[12:11 -> 12:18]  
Speaker 2:  
Number one: I want you to watch this video. Scroll down and look at this link that says "Botox."  

[12:18 -> 12:36]  
Speaker 2:  
The video starts with someone saying, "Face taping is my jam." Then the other person in the podcast asks, "Tell me about this." She responds, "If you had told me 14 months ago that I would not be doing Botox and would be taping my face instead, I would have said you’re out of your mind."  

[12:36 -> 12:49]  
Speaker 2:  
What a hook, right? This woman is basically saying, "I used to use Botox, and now I use this. I would have thought this was crazy." Then the other person says, "Tell me more."  

[12:49 -> 13:01]  
Speaker 2:  
This video has a quarter of a million likes. I don’t know how many views it has, but it’s a lot—5.4 million views, to be exact. And they’re not even selling a product.  

[13:01 -> 13:14]  
Speaker 2:  
To be clear, if you look at the comments, every single one is asking, "What’s the brand? Does anyone know the brand?" She mentions a Japanese face tape, and just by saying "Japanese face tape" instead of just "face tape," it already sounds elevated.  

[13:14 -> 13:32]  
Speaker 2:  
It’s polarizing, it’s visual, and these are all great elements for selling on TikTok. So, idea number one is Botox face tape. I think you could make $50 million in topline revenue with this.  

[13:32 -> 13:47]  
Speaker 2:  
Let’s say 15% margins—that’s about $7.5 million in profit over the next 18 months. Okay, let’s be more conservative and say 24 months. If you execute this well, you could build a brand.  

[13:47 -> 14:14]  
Speaker 2:  
There’s a huge market for this. On TikTok, everyone obviously cares about how they look. There are a lot of people who are "Botox curious" but won’t pull the trigger because it’s either too expensive—individual Botox treatments cost thousands of dollars—or they feel it’s too extreme. It crosses into plastic surgery territory, and they don’t want to go there for various reasons.  

[14:14 -> 14:29]  
Speaker 1:  
Dude, I looked this up on ChatGPT, and the answer is no. Who knows, right?  

Speaker 2:  
Health and wellness is one of those areas where the effectiveness of products can vary.  

[14:29 -> 14:52]  
Speaker 2:  
Do those jade face rollers actually work? Does putting cucumber slices on your eyes do anything? Ari came on here the other day, and I said, "Ari, you’re glowing." She said, "I did a chemical peel." I didn’t even know what that was, so I asked her to explain.  

[14:52 -> 14:57]  
Speaker 2:  
There’s a whole world of beauty treatments that fall somewhere on the spectrum of effectiveness and cost.  

[14:57 -> 14:59]  
Speaker 2:  
All I’m saying is, I think this could work.

[14:59 -> 15:40]  
Sam:  
Selling is kind of my point right now. I'm not a doctor, so I can't make health claims. I have a friend who is a doctor, though. Anyway, she does Botox for people. She was at my house, and she had her kit with her. She said, "I need to test this out."  

So, we were like, "Did you get Botox curious?" I was looking at her and said, "Whip that sucker out, baby. Let's do this." She gave me a little injection about six weeks ago in my forehead. I wasn’t even sure if I wanted to do it, but I thought, "I’m a guinea pig. You’ve got a needle, you’ve got drugs—let’s try it."  

[15:40 -> 15:51]  
Co-Host:  
I’d love to hear the excuse you’re about to make. You’re like, "I like science, and I wanted to be a supportive friend." What are your other reasons for doing Botox? Let’s make a list of Sam’s reasons.  

Sam:  
Besides wanting to look better? Go ahead.  

Co-Host:  
Looking dope naked?  

Sam:  
I mean, that’s the only reason anyone does anything, right?  

[15:51 -> 16:09]  
Sam:  
But honestly, I got so many compliments afterward.  

Co-Host:  
Did you really?  

Sam:  
Yes, I got so many compliments. People kept saying I looked really young. It made me self-conscious about how I used to look.  

Co-Host:  
Oh, dude, you’re hooked.  

Sam:  
Have you ever done it?  

Co-Host:  
No, I wouldn’t do that.  

[16:09 -> 16:31]  
Sam:  
You’re not into that, right?  

Co-Host:  
No, dude, come on.  

Sam:  
What would you say if your wife wanted to do it?  

Co-Host:  
I think my wife does want to do it, but she’s in that boat where she’s like, "I don’t really want to do it, but I’m curious." I bet if someone was at the house with the kit and said, "I can do it right now," she’d be like you. I think her forehead would start looking smooth or whatever it does.  

Sam:  
Yeah, if the needle’s right there, I’d say, "Stick it in me. Let’s do the damn thing."  

[16:31 -> 16:50]  
Co-Host:  
It’s like driving to Taco Bell versus DoorDash. If it’s brought to me, I wouldn’t not eat it if it’s there.  

Sam:  
Yeah, I guess you could say I’m Botox curious.  

Co-Host:  
I think you’re beyond curious.  

Sam:  
Activated.  

[16:50 -> 17:00]  
Co-Host:  
All right, what’s the next one?  

Sam:  
Next one. Another one in the beauty space. There’s a theme here—beauty products tap into a core human desire. They’re visual by nature, they can have before-and-afters, and they’re high-margin businesses when done right.  

[17:00 -> 17:27]  
Sam:  
I want to take anything that worked in the prior waves of e-commerce and build a TikTok-native distribution strategy around it. That’s a fancy way of saying, "If it worked with Facebook ads, I want to see if it works with TikTok videos."  

One of the big winners—I think she spoke at your conference—was a brand called Madison Reed.  

Co-Host:  
Dude, there’s a location right down the street from my house. I think they do really well.  

[17:27 -> 18:00]  
Sam:  
Yeah, Madison Reed has built a real empire around hair color. Hair color isn’t a new idea. There were many brands before them. My mom has been buying hair color since I was a kid. She’d go to Target and buy dark browns because she didn’t want gray hair.  

Co-Host:  
Damn, you’re going to do your mom like that?  

Sam:  
Oh, dude, if I’m grayed up, you don’t think my mom’s grayed up? Obviously.  

Co-Host:  
Obviously.  

Sam:  
My sister would also buy hair color if she wanted to try lighter hair for a season.  

[18:00 -> 18:40]  
Sam:  
Madison Reed basically built an online-first distribution strategy. They ran a bunch of Facebook ads and built a huge brand in the space. I don’t know their full story, but I just looked it up—topline revenue grew 20% last year to $150 million.  

Co-Host:  
Wow.  

Sam:  
Yeah, their valuation is probably something like $500 million or more. Huge success. I think you could create a new Madison Reed on TikTok. Same idea, but with a novel angle—maybe it’s easier to apply, less messy, or uses less harsh chemicals.

[18:42 -> 18:49]  
Speaker 1:  
It doesn’t damage your hair the same amount. Whatever it is, come up with your reason why this is new and build the brand off TikTok.  

[18:49 -> 18:56]  
Speaker 1:  
I think you could do this again with creators who are going to use the product, show the customers, build trust, and build your brand.  

[18:56 -> 19:03]  
Speaker 1:  
Get people searching for your brand because there’s always going to be a new wave of people who are interested in this, right?  

[19:03 -> 19:10]  
Speaker 1:  
There are always people whose hair is starting to gray. There’s always going to be a new generation, and whatever media they consume is where you need to be to sell.  

[19:10 -> 19:22]  
Speaker 1:  
Remember Touch of Gray or the men’s hair color ads? They used TV ads. Madison Reed used Facebook ads. Whatever the next generation is consuming, they’re probably going to be sold to on TikTok and Instagram Reels.  

[19:22 -> 19:33]  
Speaker 2:  
You know what’s funny? You said there’s a new generation that wants this stuff, but you know what hasn’t changed and will always stay the same? The hooks that worked in 1910 still work today.  

[19:33 -> 19:48]  
Speaker 2:  
For example, there’s this Wall Street Journal ad that tells the story of two young men. When they both graduated college, one got a Wall Street Journal subscription, and because of that, he got a better career.  

[19:48 -> 20:00]  
Speaker 2:  
It tells a story. There are so many ads that replicate that story or idea successfully. If you Google “best Wall Street Journal ad of all time,” they cite that ad.  

[20:00 -> 20:10]  
Speaker 2:  
What I like to do is find old ads from as far back as the 1930s or 1940s—print magazine ads, for example—and see what interesting lines or human nature vibes they have.  

[20:10 -> 20:18]  
Speaker 2:  
Then I just adapt them. For example, there’s a famous ad that says, “They laughed at me when I sat down, but then when I started to play the piano…”  

[20:18 -> 20:29]  
Speaker 2:  
That’s called the curiosity gap. Do you remember BuzzFeed or Upworthy? They used hooks like “10 reasons why blank—you won’t believe number seven.” It’s the same concept as that piano ad.  

[20:29 -> 20:45]  
Speaker 2:  
It’s really fun to find old ads and ask, “What’s the human nature element here?” Then replicate it on TikTok.  

[20:45 -> 20:50]  
Speaker 1:  
Exactly. It’s a great way to find hooks.  

[20:50 -> 20:53]  
Speaker 1:  
Okay, here’s a different category. I did beauty, so let me give you a different one: self-help.  

[20:53 -> 21:01]  
Speaker 1:  
One of the top-selling products in the last year is something called *The Shadow Work Journal*. Have you heard of this?  

[21:01 -> 21:04]  
Speaker 2:  
No, but that’s a great name—*Shadow Work Journal*.  

[21:04 -> 21:14]  
Speaker 1:  
If you look on Amazon, the listing for this journal has over 5,000 ratings. It’s a self-published book, and on TikTok, it has sold over 100,000 copies.  

[21:14 -> 21:27]  
Speaker 1:  
Do you know how rare it is for a book to sell 100,000 copies in its first year with no other promotion? This was a huge success.  

[21:27 -> 21:40]  
Speaker 1:  
People on TikTok would open the book and say, “I gasped when I read this line.” Then they’d read some heavy, emo-ish quote from the journal.  

[21:40 -> 21:51]  
Speaker 1:  
Or they’d say, “I finally figured out my true shadow.” It taps into this whole vibe of mysticism and self-discovery.  

[21:51 -> 22:06]  
Speaker 1:  
There’s a group of people who love therapy, horoscopes, and the mystical self. This book capitalized on that.  

[22:06 -> 22:19]  
Speaker 1:  
If I were to write a modern-day version of Tony Robbins’ *Unleash the Power Within* or Mark Manson’s *The Subtle Art of Not Giving a [__]*, I think it could be a massive success.  

[22:19 -> 22:36]  
Speaker 1:  
If I spent nine months and a quarter-million dollars seeding it on TikTok, I think I could create a bestseller and sell millions of copies.

[22:50 -> 23:15]  
Speaker 1:  
Is this book one of those things where it's like a journal? You know, two or three pages of writing and then a week's worth of prompts?  

Speaker 2:  
No, no, no. This is not like a planner or a daily planner. I mean, I haven’t read the whole thing, but it’s basically a lot of text content. Then there are fill-in-the-blank sections or boxes where you write your thoughts. But it’s not just a journal where you log your day.  

Speaker 1:  
Have you seen *Designing Your Life*? Is that what it’s called?  

Speaker 2:  
Yeah, *Designing Your Life*. It’s a book by—well, it checks all the boxes. It’s written by a Harvard—or maybe Stanford—psychologist who spent 30 years studying happiness and lifestyle design.  

Speaker 1:  
Stanford, I think.  

Speaker 2:  
Yeah, Stanford. It’s a cool book. I read it, and now they have a journal that goes along with it. You can look at it and figure out what works and what doesn’t.  

[23:15 -> 23:56]  
Speaker 1:  
By the way, I don’t know if this angle would work for you. Have you Googled the author of that book?  

Speaker 2:  
Yeah, yeah. She’s very aspirational. She’s different from me—very aspirational.  

Speaker 1:  
Nobody can see that when they’re buying the book or just watching a TikTok. It didn’t look like a commercial for the book. It was just someone saying how a line in the book really spoke to them or how it changed the way they view things.  

Speaker 2:  
There’s this whole hook on TikTok that’s really famous. It starts with someone saying, “Do you have any book recommendations?” Then they zoom the camera in really close to their nose and eyes and say, “I have books that will change the way you look at the world. I have books so good you’ll never be able to look at a man the same way again.” And they’re like romance books or whatever. Or, “I have books that will melt the frontal lobe of your brain.” They go really intense with it. That’s a common, memed hook they use.  

[23:56 -> 24:54]  
Speaker 1:  
I like how you were basically saying, “I don’t know if you could do this because this girl’s hot.”  

Speaker 2:  
Well, she’s a 25-year-old. I’m looking at this *New York Times* article, and she’s 25, which is amazing. She’s a really pretty woman, and that’s TikTok’s demographic.  

Speaker 1:  
But in TikTok world, the videos aren’t about her. The videos are from the creator, and the creator just looks how they look.  

Speaker 2:  
Exactly. And this is amazing. You know, at one point, I felt like I was riding a horse a few years after Henry Ford invented the car. You just can’t compete. When I see these videos and these plans, I think to myself, “I can never compete in this world of e-commerce. This is insane.”  

Speaker 1:  
The way they zoom in on someone’s eyes—if I were in that meeting trying to figure out how to do it, or in my bedroom at night trying to write the script, I’d think, “This is so cringe. I can’t do this.”  

Speaker 2:  
Exactly. I’d never be able to hit post.  

Speaker 1:  
It’s really hard.  

[24:54 -> 26:23]  
Speaker 2:  
I totally get what you mean. And by the way, I’m not saying these things are easy to do. I just mean that someone’s going to do them. The way to think about this is to focus on your attributes.  

For you and me, at this point, if we want to do something successful, we have other attributes. For example, I could just use capital—I have a lot of capital, so I could invest in things that are already working. That’s an easy way to make money.  

I also have a good network. I know a lot of people doing interesting things, and they’d uniquely let me into opportunities. That’s cool.  

Maybe I have this audience from the podcast. So, I have attributes.  

Speaker 1:  
And if your attributes are that you have a ton of time, nothing to lose, and...

[26:26 -> 26:42]  
Speaker 1:  
I’m pretty shameless with my phone, right?  

Speaker 2:  
Totally.  

Speaker 1:  
I grew up mastering this stuff. I’ve just been messing around on TikTok, but I understand the meta game here better than whoever is the brand marketing manager or the head of paid acquisition for Madison Reed or whatever.  

[26:43 -> 27:04]  
Speaker 2:  
Exactly. If you’re the one who gets it, like you, Moyes, then you have an edge. You can go to Facebook Ads and tinker all day in a way that Procter & Gamble’s head of marketing won’t. They’re buying Super Bowl ads; they’re not sitting in Facebook Ad Manager every day. You have different advantages than the incumbents. If your advantage is that you grew up on these networks or you’re willing to hustle in ways they won’t—like sliding into DMs, sending out free products, and doing all the grassroots stuff—you can win.  

[27:05 -> 27:16]  
Speaker 1:  
Exactly. You can win in categories that already exist. When I was around Moyes—well, we were just acquaintances, but I’d see him on his computer, and he’d be like, “Check this out.”  

[27:17 -> 27:50]  
Speaker 1:  
He would track the numbers every single day in a spreadsheet. He’d say, “We just changed this number from 1% to 1.25%. Now that 1.25% is the standard for today. Tomorrow, we’re going to add a yellow or red arrow pointing at this one thing. Boom, now we’ve got 1.25% to 1.4%.” It was methodical. I used to joke and call us “spreadsheet monkeys” because all we were doing was staring at spreadsheets, turning 1.4% into 1.6%.  

[27:51 -> 28:13]  
Speaker 2:  
And he hasn’t changed. It’s not like he was just like that in the beginning and now he’s different because he’s “made it.” No, he’s still the same. I had a question for him about our e-commerce business. I asked, “Here’s how we’re keeping track of this. Should I trust Google Analytics, Shopify Analytics, or something else? They all give slightly different numbers. What did you do?”  

[28:14 -> 28:48]  
Speaker 1:  
I thought he’d say, “I just kept it simple.” And he did say that, but then he added, “Every day, I wrote down the numbers for all the platforms in a sheet.” He’s still doing it, even now, 10 years later. The guy’s an animal. $100 million later, and he still wakes up every morning, triangulates the numbers, and tracks them. He said, “They never drift more than 4%, but I do it anyway.” It’s almost like a daily practice, almost like a spiritual act—an offering to the economic gods.  

[28:49 -> 29:22]  
Speaker 2:  
It’s like being a chef at a bakery. If you’ve worked there for 20 years, you know that leaving the dough out for an hour versus 45 minutes before putting it in the oven makes a minor difference. You notice these small differences because you’ve done it thousands of times. That’s basically the same thing.  

[29:23 -> 29:32]  
Speaker 1:  
I admire his tenacity. I don’t think he does anything without being tenacious.  

[29:33 -> 29:38]  
Speaker 2:  
All right, let me continue. I’ve got two more ideas for you.  

[29:39 -> 29:51]  
Speaker 1:  
Okay, so I mentioned beauty stuff and self-help. By the way, that’s how Mark Manson made *The Subtle Art of Not Giving a F***.* Tens of millions of copies sold. He was blogging before that, built a blog audience, and used it to launch the book.  

[29:52 -> 29:58]  
Speaker 2:  
A blog audience? That seems so old-school.  

[29:59 -> 30:00]  
Speaker 1:  
Right? A blog takes 10 years!
    `
  }
};

describe('LLM Highlight Extraction Tests', () => {
  const llmUtils = new LLM_API_Utils();
  // const MODEL_NAME = 'chatgpt-4o-latest';
  const MODEL_NAME = 'gpt-4o-mini';
  // const MODEL_NAME = 'gpt-4o-mini';



  // Test different prompt variations to find the most effective one
  const PROMPT_VARIATIONS = [
  {
    name: 'Controversial and Insightful Gem Extractor',
    prompt: `Extract the most provocative and insightful moments that will stop sophisticated viewers in their tracks and compel them to engage.

Focus on:
- Bold, controversial opinions and challenges to the status quo
- Data-backed analyses that challenge conventional wisdom or confirm existing beliefs
- Deep technical insights and expert analyses
- Inspirational quotes with profound implications

Format each highlight as:
[XX:XX -> YY:YY]

Topic: Striking one-liner or question that piques interest
💎 INSIGHT: Core arguments, data points, or explanations (succinctly presented)

Rules:
- Lead with the most compelling element to immediately hook the audience
- Emphasize the most shocking or enlightening aspects first
- Keep language sharp, clear, and impactful
- Avoid fluff; focus on substantial, meaningful content
- Cater to an audience that values depth, originality, and challenging ideas
- Only include truly high-value, high-signal moments, skip if there isn't any.

Each highlight should feel like an unmissable insight that offers significant value.`
  },
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
      
      Make each section punchy and shareable. Focus on insights that would make people want to follow for more.`
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
      name: 'Leo System Prompt',
      prompt: `Extract segments where the speaker expresses a controversial opinion, challenges conventional wisdom, or engages in philosophical reflections, or statements that could inspire thought, provides expert analysis on complex topics 

Identify moments that are:
- Highly quotable
- Contrarian/surprising
- Data-driven
- Actionable
- Story-driven

Look for:
- Unpopular or bold statements
- Memorable one-liners
- Counterarguments to common beliefs
- Advanced strategies or methodologies
- Clarification of common misconceptions
- Philosophical insights
- Motivational affirmations



Format each highlight as:
[Timestamp]
🔬 Topic: Brief title

💎 Insight: Summary of the explanation or analysis

✨ Quote (if applicable) : "Exact words from the speaker"

🎯 TAKEAWAY: Why this matters

📝 CONTEXT: Key supporting details

--- 

Two sentence summary of highlight.
`
    }
  ];

  beforeAll(async () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
    const logFile = `tests/llm_highlight_system_role_optimization_logs/highlight_systemRole_optimization_${timestamp}.md`;
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const log = (message) => {
      console.log(message);
      logStream.write(message + '\n');
    };

    log('\nLong Interview Highlights Extraction - Large Language Model System Role Iteration');
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