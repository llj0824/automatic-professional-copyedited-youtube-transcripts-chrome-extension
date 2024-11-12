import LLM_API_Utils from '../popup/llm_api_utils.js';

// Sample test transcript segment
export const testTranscript = `
*** Background Context ***
Title: Dario Amodei: Anthropic CEO on Claude, AGI & the Future of AI & Humanity | Lex Fridman Podcast #452
Description: Dario Amodei is the CEO of Anthropic, the company that created Claude. Amanda Askell is an AI researcher working on Claude's character and personality. Chris Olah is an AI researcher working on mechanistic interpretability.

*** Transcript ***
[00:00] if you extrapolate the curves that we&amp;#39;ve
[00:02] had so far right if if you say well I
[00:04] don&amp;#39;t know we&amp;#39;re starting to get to like
[00:06] PhD level and and last year we were at
[00:08] undergraduate level and the year before
[00:10] we were at like the level of a high
[00:12] school student again you can you can
[00:14] quibble with at what tasks and for what
[00:17] we&amp;#39;re still missing modalities but those
[00:18] are being added like computer use was
[00:20] added like image generation has been
[00:22] added if you just kind of like eyeball
[00:24] the rate at which these capabilities are
[00:26] increasing it does make you think that
[00:29] we&amp;#39;ll get there by 2026 or 2027 I think
[00:32] there are still worlds where it doesn&amp;#39;t
[00:33] happen in in a 100 years those world the
[00:36] number of those worlds is rapidly
[00:37] decreasing we are rapidly running out of
[00:40] truly convincing blockers truly
[00:43] compelling reasons why this will not
[00:44] happen in the next few years the scale
[00:46] up is very quick like we we do this
[00:48] today we make a model and then we deploy
[00:50] thousands maybe tens of thousands of
[00:52] instances of it I think by the time you
[00:55] know certainly within two to three years
[00:57] whether we have these super powerful AIS
[00:58] or not ERS are going to get to the size
[01:01] where you&amp;#39;ll be able to deploy millions
[01:02] of these I am optimistic about meaning I
[01:06] worry about economics and the
[01:09] concentration of power that&amp;#39;s actually
[01:10] what I worry about more the abuse of
[01:13] power and AI increases the amount of
[01:17] power in the world and if you
[01:18] concentrate that power and abuse that
[01:20] power it can do immeasurable damage yes
[01:23] it&amp;#39;s very frightening it&amp;#39;s very it&amp;#39;s
[01:24] very
[01:26] frightening the following is a
[01:28] conversation with Dario amade CEO of
[01:32] anthropic the company that created
[01:34] Claude that is currently and often at
[01:36] the top of most llm Benchmark leader
[01:39] boards on top of that Dario and the
[01:41] anthropic team have been outspoken
[01:44] advocates for taking the topic of AI
[01:46] safety very seriously and they have
[01:49] continued to publish a lot of
[01:51] fascinating AI research on this and
[01:54] other topics I&amp;#39;m also joined afterwards
[01:57] by two other brilliant people from
[01:59] propic first Amanda ascal who is a
[02:03] researcher working on alignment and
[02:06] fine-tuning of Claude including the
[02:08] design of claude&amp;#39;s character and
[02:10] personality a few folks told me she has
[02:13] probably talked with Claude more than
[02:15] any human at anthropic so she was
[02:19] definitely a fascinating person to talk
[02:21] to about prompt engineering and
[02:23] practical advice on how to get the best
[02:25] out of Claude after that chrisa stopped
[02:29] by for chat he&amp;#39;s one of the pioneers of
[02:32] the field of mechanistic
[02:34] interpretability which is an exciting
[02:36] set of efforts that aims to reverse
[02:38] engineer neural networks to figure out
[02:41] what&amp;#39;s going on inside inferring
[02:44] behaviors from neural activation
[02:46] patterns inside the network this is a
[02:49] very promising approach for keeping
[02:52] future super intelligent AI systems safe
[02:55] for example by detecting from the
[02:57] activations when the model is trying to
[02:59] deceive the human it is talking
[03:02] to this is Alex Freedman podcast to
[03:05] support it please check out our sponsors
[03:07] in the description and now dear friends
[03:11] here&amp;#39;s Dario
[03:13] amade let&amp;#39;s start with a big idea of
[03:15] scaling laws and the scaling hypothesis
[03:17] what is it what is its history and where
[03:20] do we stand today so I can only describe
[03:23] it as it you know as it relates to kind
[03:25] of my own experience but I&amp;#39;ve been in
[03:27] the AI field for about uh 10 years and
[03:30] it was something I noticed very early on
[03:32] so I first joined the AI world when I
[03:34] was uh working at BYU with Andrew in in
[03:36] late 2014 which is almost exactly 10
[03:39] years ago now and the first thing we
[03:42] worked on was speech recognition systems
[03:45] and in those days I think deep learning
[03:47] was a new thing it had made lots of
[03:48] progress but everyone was always saying
[03:51] we don&amp;#39;t have the algorithms we need to
[03:52] succeed you know we we we we&amp;#39;re we&amp;#39;re
[03:54] not we&amp;#39;re only matching a tiny tiny
[03:57] fraction there&amp;#39;s so much we need to kind
[03:59] of discover algorithmically we haven&amp;#39;t
[04:01] found the picture of how to match the
[04:03] human brain uh and when you know in some
[04:07] ways was fortunate I was kind of you
[04:09] know you can have almost beginner&amp;#39;s luck
[04:10] right I was like a a newcomer to the
[04:12] field and you know I looked at the
[04:14] neural net that we were using for speech
[04:16] the recurrent neural networks and I said
[04:18] I don&amp;#39;t know what if you make them
[04:19] bigger and give them more layers and
[04:21] what if you scale up the data along with
[04:23] this right I just saw these as as like
[04:25] independent dials that you could turn
[04:27] and I noticed that the model started to
[04:29] do better and better as you gave them
[04:31] more data as you as you made the models
[04:34] larger as you trained them for longer um
[04:36] and I I didn&amp;#39;t measure things precisely
[04:39] in those days but but along with with
[04:41] colleagues we very much got the informal
[04:43] sense that the more data and the more
[04:46] compute and the more training you put
[04:48] into these models the better they
[04:50] perform and so initially my thinking was
[04:53] hey maybe that is just true for speech
[04:55] recognition systems right maybe maybe
[04:57] that&amp;#39;s just one particular quirk one
[04:59] particular area I think it wasn&amp;#39;t until
[05:02] 2017 when I first saw the results from
[05:05] gpt1 that it clicked for me that
[05:08] language is probably the area in which
[05:10] we can do this we can get trillions of
[05:13] words of language data we can train on
[05:16] them and the models we were training in
[05:18] those days were tiny you could train
[05:19] them on one to eight gpus whereas you
[05:22] know now we train jobs on tens of
[05:24] thousands soon going to hundreds of
[05:26] thousands of gpus and so when I when I
[05:28] saw those two things together um and you
[05:31] know there were a few people like ilaser
[05:33] who who you&amp;#39;ve interviewed who had
[05:35] somewhat similar reviews right he might
[05:37] have been the first one although I think
[05:39] a few people came to came to similar
[05:41] views around the same time Right There
[05:42] Was You Know Rich Sutton&amp;#39;s bitter lesson
[05:44] there was gur wrote about the scaling
[05:47] hypothesis but I think somewhere between
[05:49] 2014 and 2017 was when it really clicked
[05:53] for me when I really got conviction that
[05:55] hey we&amp;#39;re going to be able to do these
[05:57] incredibly wide cognitive tasks if we
[06:00] just if we just scale up the models and
[06:03] at at every stage of scaling there are
[06:06] always arguments and you know when I
[06:07] first heard them honestly I thought
[06:09] probably I&amp;#39;m the one who&amp;#39;s wrong and you
[06:11] know all these all these experts in the
[06:12] field are right they know the situation
[06:14] better better than I do right there&amp;#39;s
[06:16] you know the Chomsky argument about like
[06:18] you can get syntactics but you can&amp;#39;t get
[06:20] semantics there&amp;#39;s this idea oh you can
[06:22] make a sentence make sense but you can&amp;#39;t
[06:24] make a paragraph makes sense the latest
[06:26] one we have today is uh you know we&amp;#39;re
[06:29] going to run out of data or the data
[06:30] isn&amp;#39;t high quality enough or models
[06:32] can&amp;#39;t reason and and each time every
[06:35] time we manage to we manage to either
[06:37] find a way around or scaling just is the
[06:39] way around um sometimes it&amp;#39;s one
[06:42] sometimes it&amp;#39;s the other uh and and so
[06:44] I&amp;#39;m now at this point I I I still think
[06:47] you know it&amp;#39;s it&amp;#39;s it&amp;#39;s always quite
[06:48] uncertain we have nothing but inductive
[06:50] inference to tell us that the next few
[06:53] years are going to be like the next the
[06:54] last 10 years but but I&amp;#39;ve seen I&amp;#39;ve
[06:57] seen the movie enough times I&amp;#39;ve seen
[06:59] the story happen for for enough times to
[07:01] to really believe that probably the
[07:04] scaling is going to continue and that
[07:05] there&amp;#39;s some magic to it that we haven&amp;#39;t
[07:08] really explained on a theoretical basis
[07:10] yet and of course the scaling here is
[07:13] bigger networks bigger data bigger
[07:15] compute yes all in in particular linear
[07:19] scaling up of bigger networks bigger
[07:23] training times and uh more and and more
[07:26] data uh so all of these things almost
[07:28] like a chemical reaction you know you
[07:30] have three ingredients in the chemical
[07:31] reaction and you need to linearly scale
[07:34] up the three ingredients if you scale up
[07:35] one not the others you run out of the
[07:37] other reagents and and the reaction
[07:39] stops but if you scale up everything
[07:42] everything in series then then the
[07:44] reaction can proceed and of course now
[07:46] that you have this kind of empirical
[07:48] scienceart you can apply it to
[07:51] other uh more nuanced things like
[07:53] scaling laws applied to interpretability
[07:56] or scaling laws applied to posttraining
[07:58] or just seeing how does this thing scale
[08:01] but the big scaling law I guess the
[08:03] underlying scaling hypothesis has to do
[08:06] with big networks Big Data leads to
[08:08] intelligence yeah we&amp;#39;ve we&amp;#39;ve documented
[08:11] scaling laws in lots of domains other
[08:13] than language right so uh initially the
[08:17] the paper we did that first showed it
[08:18] was in early 2020 where we first showed
[08:21] it for language there was then some work
[08:23] late in 2020 where we showed the same
[08:26] thing for other modalities like images
[08:29] video
[08:30] text to image image to text math they
[08:33] all had the same pattern and and you&amp;#39;re
[08:35] right now there are other stages like
[08:37] posttraining or there are new types of
[08:39] reasoning models and in in in all of
[08:42] those cases that we&amp;#39;ve measured we see
[08:45] similar similar types of scaling laws a
[08:48] bit of a philosophical question but
[08:49] what&amp;#39;s your intuition about why bigger
[08:52] is better in terms of network size and
[08:54] data size why does it lead to more
[08:58] intelligent models so in my previous
[09:01] career as a as a biophysicist so I did
[09:03] physics undergrad and then biophysics in
[09:06] in in in grad school so I think back to
[09:08] what I know as a physicist which is
[09:09] actually much less than what some of my
[09:11] colleagues at anthropic have in terms of
[09:14] in terms of expertise in physics uh
[09:17] there&amp;#39;s this there&amp;#39;s this concept called
[09:19] the one over F noise and one overx
[09:21] distributions um where where often um uh
[09:25] you know just just like if you add up a
[09:27] bunch of natural processes you get
[09:29] gaussian if you add up a bunch of kind
[09:31] of differently distributed natural
[09:34] processes if you like if you like take a
[09:37] take a um probe and and hook it up to a
[09:39] resistor the distribution of the thermal
[09:42] noise in the resistor goes as one over
[09:44] the frequency um it&amp;#39;s some kind of
[09:46] natural convergent distribution uh and
[09:49] and I I I I and and I think what it
[09:52] amounts to is that if you look at a lot
[09:54] of things that are that are produced by
[09:56] some natural process that has a lot of
[09:58] different scales right not a gaussian
[10:00] which is kind of narrowly distributed
[10:02] but you know if I look at kind of like
[10:04] large and small fluctuations that lead
[10:07] to lead to electrical noise um they have
[10:10] this decaying 1 overx distribution and
[10:13] so now I think of like patterns in the
[10:15] physical world right if I if or or in
[10:18] language if I think about the patterns
[10:20] in language there are some really simple
[10:21] patterns some words are much more common
[10:23] than others like the&amp;#39; then there&amp;#39;s basic
[10:26] noun verb structure then there&amp;#39;s the
[10:28] fact that you know you know nouns and
[10:30] verbs have to agree they have to
[10:31] coordinate and there&amp;#39;s the higher level
[10:33] sentence structure then there&amp;#39;s the
[10:34] Thematic structure of paragraphs and so
[10:37] the fact that there&amp;#39;s this regressing
[10:38] structure you can imagine that as you
[10:41] make the networks larger first they
[10:43] capture the really simple correlations
[10:45] the really simple patterns and there&amp;#39;s
[10:47] this long taale of other patterns and if
[10:50] that long taale of other patterns is
[10:52] really smooth like it is with the one
[10:54] over F noise in you know physical
[10:56] processes like like like resistors then
[10:59] you could imagine as you make the
[11:00] network larger it&amp;#39;s kind of capturing
[11:02] more and more of that distribution and
[11:05] so that smoothness gets reflected in how
[11:07] well the models are at predicting and
[11:09] how well they perform language is an
[11:11] evolved process right we&amp;#39;ve we&amp;#39;ve
[11:14] developed language we have common words
[11:17] and less common words we have common
[11:18] expressions and less common Expressions
[11:21] we have ideas cliches that are expressed
[11:24] frequently and we have novel ideas and
[11:26] that process has has developed has
[11:28] evolved with humans over millions of
[11:30] years and so the the the guess and this
[11:33] is pure speculation would be would be
[11:35] that there is there&amp;#39;s some kind of
[11:37] longtail distribution of of of the
[11:40] distribution of these ideas so there&amp;#39;s
[11:42] the long tail but also there&amp;#39;s the
[11:43] height of the hierarchy of Concepts that
[11:46] you&amp;#39;re building up so the bigger the
[11:48] network presumably you have a higher
[11:49] capacity to exactly if you have a small
[11:51] Network you only get the common stuff
[11:53] right if if I take a tiny neural network
[11:56] it&amp;#39;s very good at understanding that you
[11:58] know a sentence has to have you know
[12:00] verb adjective noun right but it&amp;#39;s it&amp;#39;s
[12:02] terrible at deciding what those verb
[12:04] adjective and noun should be and whether
[12:06] they should make sense if I make it just
[12:08] a little bigger it gets good at that
[12:10] then suddenly it&amp;#39;s good at the sentences
[12:11] but it&amp;#39;s not good at the paragraphs and
[12:13] so the these these rare and more complex
[12:16] patterns get picked up as I add as I add
[12:18] more capacity to the network well the
[12:20] natural question then is what&amp;#39;s the
[12:22] ceiling of this like how complicated and
[12:26] complex is the real world how much of
[12:28] stuff is there to learn I don&amp;#39;t think
[12:30] any of us knows the answer to that
[12:32] question um I my strong Instinct would
[12:35] be that there&amp;#39;s no ceiling below level
[12:37] of humans right we humans are able to
[12:39] understand these various patterns and so
[12:41] that that makes me think that if we
[12:43] continue to you know scale up these
[12:46] these these models to kind of develop
[12:49] new methods for training them and
[12:50] scaling them up uh that will at least
[12:53] get to the level that we&amp;#39;ve gotten to
[12:54] with humans there&amp;#39;s then a question of
[12:56] you know how much more is it possible to
[12:59] understand than humans do how much how
[13:01] much is it possible to be smarter and
[13:03] more perceptive than humans I I would
[13:05] guess the answer has has got to be
[13:08] domain dependent if I look at an area
[13:11] like biology and you know I wrote this
[13:13] essay Machines of Loving Grace it seems
[13:15] to me that humans are struggling to
[13:19] understand the complexity of biology
[13:20] right if you go to Stanford or to
[13:22] Harvard or to Berkeley you have whole
[13:25] Departments of you know folks trying to
[13:27] study you know like the immune system or
[13:30] metabolic pathways and and each person
[13:33] understands only a tiny bit part of it
[13:35] specializes and they&amp;#39;re struggling to
[13:37] combine their knowledge with that of
[13:39] with that of other humans and so I have
[13:41] an instinct that there&amp;#39;s there&amp;#39;s a lot
[13:42] of room at the top for AIS to get
[13:45] smarter if I think of something like
[13:48] materials in the in the physical world
[13:50] or you know um like addressing you know
[13:53] conflicts between humans or something
[13:55] like that I mean you know it it may be
[13:57] there&amp;#39;s only some of these problems are
[13:59] not intractable but much harder and and
[14:01] it it may be that there&amp;#39;s only there&amp;#39;s
[14:04] only so well you can do with some of
[14:05] these things right just like with speech
[14:06] recognition there&amp;#39;s only so clear I can
[14:09] hear your speech so I think in some
[14:11] areas there may be ceilings in in in you
[14:14] know that are very close to what humans
[14:15] have done in other areas those ceilings
[14:17] may be very far away and I think we&amp;#39;ll
[14:19] only find out when we build these
[14:21] systems uh there&amp;#39;s it&amp;#39;s very hard to
[14:23] know in advance we can speculate but we
[14:25] can&amp;#39;t be sure and in some domains the
[14:27] ceiling might have to do with human
[14:29] bureaucracies and things like this as
[14:30] you&amp;#39;re right about yes so humans
[14:32] fundamentally have to be part of the
[14:33] loop that&amp;#39;s the cause of the ceiling not
[14:36] maybe the limits of the intelligence
[14:38] yeah I think in many cases um you know
[14:41] in theory technology could change very
[14:44] fast for example all the things that we
[14:46] might invent with respect to biology um
[14:49] but remember there&amp;#39;s there&amp;#39;s a you know
[14:51] there&amp;#39;s a clinical trial system that we
[14:53] have to go through to actually
[14:55] administer these things to humans I
[14:57] think that&amp;#39;s a mixture of things that
[14:58] are unnecessary and bureaucratic and
[15:01] things that kind of protect the
[15:03] Integrity of society and the whole
[15:04] challenge is that it&amp;#39;s hard to tell it&amp;#39;s
[15:06] hard to tell what&amp;#39;s going on uh it&amp;#39;s
[15:07] hard to tell which is which right my my
[15:09] view is definitely I think in terms of
[15:12] drug development we my view is that
[15:14] we&amp;#39;re too slow and we&amp;#39;re too
[15:16] conservative but certainly if you get
[15:18] these things wrong you know it&amp;#39;s it&amp;#39;s
[15:19] possible to to to risk people&amp;#39;s lives by
[15:22] by being by being by being too Reckless
[15:24] and so at least at least some of these
[15:26] human institutions are in fact
[15:29] protecting people so it&amp;#39;s it&amp;#39;s all about
[15:31] finding the balance I strongly suspect
[15:33] that balance is kind of more on the side
[15:35] of pushing to make things happen faster
[15:37] but there is a balance if we do hit a
[15:40] limit if we do hit a Slowdown in the
[15:43] scaling laws what do you think would be
[15:45] the reason is it compute limited data
[15:47] limited uh is it something else idea
[15:50] limited so a few things now we&amp;#39;re
[15:52] talking about hitting the limit before
[15:54] we get to the level of of humans and the
[15:56] skill of humans um so so I think one
[15:59] that&amp;#39;s you know one that&amp;#39;s popular today
[16:01] and I think you know could be a limit
[16:03] that we run into I like most of the
[16:05] limits I would bet against it but it&amp;#39;s
[16:06] definitely possible is we simply run out
[16:09] of data there&amp;#39;s only so much data on the
[16:11] internet and there&amp;#39;s issues with the
[16:12] quality of the data right you can get
[16:15] hundreds of trillions of words on the
[16:17] internet but a lot of it is is
[16:19] repetitive or it&amp;#39;s search engine you
[16:22] know search engine optimization driil or
[16:24] maybe in the future it&amp;#39;ll even be text
[16:26] generated by AIS itself uh and and so I
[16:30] think there are limits to what to to
[16:32] what can be produced in this way that
[16:35] said we and I would guess other
[16:37] companies are working on ways to make
[16:39] data synthetic uh where you can you know
[16:42] you can use the model to generate more
[16:44] data of the type that you have that you
[16:46] have already or even generate data from
[16:49] scratch if you think about uh what was
[16:51] done with uh deep mines Alpha go zero
[16:54] they managed to get a bot all the way
[16:55] from you know no ability to play Go
[16:58] whatsoever to above human level just by
[17:00] playing against itself there was no
[17:02] example data from humans required in the
[17:05] the alphao zero version of it the other
[17:07] direction of course is these reasoning
[17:09] models that do Chain of Thought and stop
[17:11] to think um and and reflect on their own
[17:13] thinking in a way that&amp;#39;s another kind of
[17:16] synthetic data coupled with
[17:18] reinforcement learning so my my guess is
[17:20] with one of those methods we&amp;#39;ll get
[17:21] around the data limitation or there may
[17:23] be other sources of data that are that
[17:25] are available um we could just observe
[17:28] that even if there&amp;#39;s no problem with
[17:30] data as we start to scale models up they
[17:32] just stop getting better it&amp;#39;s it seemed
[17:35] to be a a reliable observation that
[17:37] they&amp;#39;ve gotten better that could just
[17:39] stop at some point for a reason we don&amp;#39;t
[17:41] understand um the answer could be that
[17:44] we need to uh you know we need to invent
[17:47] some new architecture um it&amp;#39;s been there
[17:50] have been problems in the past with with
[17:52] say numerical stability of models where
[17:55] it looked like things were were leveling
[17:57] off but but actually you know know when
[17:59] we when we when we found the right
[18:00] Unblocker they didn&amp;#39;t end up doing so so
[18:02] perhaps there&amp;#39;s new some new
[18:05] optimization method or some new uh
[18:07] Technique we need to to unblock things
[18:09] I&amp;#39;ve seen no evidence of that so far but
[18:11] if things were to to slow down that
[18:13] perhaps could be one reason what about
[18:16] the limits of compute meaning uh the
[18:20] expensive uh nature of building bigger
[18:22] and bigger data centers so right now I
[18:24] think uh you know most of the Frontier
[18:27] Model companies I would guess are are
[18:29] operating you know roughly you know $1
[18:31] billion scale plus or minus a factor of
[18:34] three right those are the models that
[18:35] exist now or are being trained now uh I
[18:38] think next year we&amp;#39;re going to go to a
[18:39] few billion and then uh 2026 we may go
[18:43] to uh uh you know above 10 10 10 billion
[18:46] and probably by 2027 their Ambitions to
[18:49] build hundred hundred billion dollar uh
[18:52] hundred billion dollar clusters and I
[18:53] think all of that actually will happen
[18:55] there&amp;#39;s a lot of determination to build
[18:57] the compute to do it within this country
[19:00] uh and I would guess that it actually
[19:01] does happen now if we get to 100 billion
[19:05] that&amp;#39;s still not enough compute that&amp;#39;s
[19:06] still not enough scale then either we
[19:09] need even more scale or we need to
[19:11] develop some way of doing it more
[19:13] efficiently of Shifting The Curve um I
[19:15] think be between all of these one of the
[19:17] reasons I&amp;#39;m bullish about powerful AI
[19:19] happening so fast is just that if you
[19:21] extrapolate the next few points on the
[19:23] curve we&amp;#39;re very quickly getting towards
[19:26] human level ability right some of the
[19:28] new models that that we developed some
[19:31] some reasoning models that have come
[19:32] from other companies they&amp;#39;re starting to
[19:34] get to what I would call the PHD or
[19:36] professional level right if you look at
[19:38] their their coding ability um the latest
[19:41] model we released Sonet 3.5 the new or
[19:45] updated version it gets something like
[19:47] 50% on sbench and sbench is an example
[19:50] of a bunch of professional real world
[19:52] software engineering tasks at the
[19:55] beginning of the year I think the
[19:57] state-of-the-art was three or 4% so in
[20:00] 10 months we&amp;#39;ve gone from 3% to 50% on
[20:03] this task and I think in another year
[20:05] we&amp;#39;ll probably be at 90% I mean I don&amp;#39;t
[20:07] know but might might even be might even
[20:09] be less than that uh we&amp;#39;ve seen similar
[20:12] things in graduate level math physics
[20:15] and biology from Models like open AI 01
[20:19] uh so uh if we if we just continue to
[20:22] extrapolate this right in terms of skill
[20:24] skill that we have I think if we
[20:26] extrapolate the straight curve Within a
[20:28] few years we will get to these models
[20:30] being you know above the the highest
[20:33] professional level in terms of humans
[20:35] now will that curve continue you&amp;#39;ve
[20:37] pointed to and I&amp;#39;ve pointed to a lot of
[20:38] reasons why you know possible reasons
[20:40] why that might not happen but if the if
[20:42] the extrapolation curve continues that
[20:44] is the trajectory we&amp;#39;re on so anthropic
[20:47] has several competitors it&amp;#39;d be
[20:49] interesting to get your sort of view of
[20:50] it all open aai Google xai meta what
[20:53] does it take to win in the broad sense
[20:56] of win in the space yeah so I want to
[20:59] separate out a couple things right so
[21:01] you know anthropics anthropic mission is
[21:03] to kind of try to make this all go well
[21:06] right and and you know we have a theory
[21:08] of change called race to the top right
[21:11] race to the top is about trying to push
[21:15] the other players to do the right thing
[21:18] by setting an example it&amp;#39;s not about
[21:19] being the good guy it&amp;#39;s about setting
[21:21] things up so that all of us can be the
[21:23] good guy I&amp;#39;ll give a few examples of
[21:25] this early in the history of anthropic
[21:27] one of our co-founders Chris Ola who I
[21:29] believe you&amp;#39;re you&amp;#39;re interviewing soon
[21:31] you know he&amp;#39;s the co-founder of the
[21:32] field of mechanistic interpretability
[21:34] which is an attempt to understand what&amp;#39;s
[21:36] going on inside AI models uh so we had
[21:40] him and one of our early teams focus on
[21:43] this area of interpretability which we
[21:44] think is good for making models safe and
[21:47] transparent for three or four years that
[21:50] had no commercial application whatsoever
[21:52] it still doesn&amp;#39;t today we&amp;#39;re doing some
[21:54] early betas with it and probably it will
[21:56] eventually but uh you know this is a
[21:58] very very long research bed in one in
[22:01] which we&amp;#39;ve we&amp;#39;ve built in public and
[22:03] shared our results publicly and and we
[22:06] did this because you know we think it&amp;#39;s
[22:07] a way to make models safer an
[22:09] interesting thing is that as we&amp;#39;ve done
[22:12] this other companies have started doing
[22:14] it as well in some cases because they&amp;#39;ve
[22:16] been inspired by it in some cases
[22:18] because they&amp;#39;re worried that uh you know
[22:21] if if other companies are doing this
[22:23] that look more responsible they want to
[22:25] look more responsible too no one wants
[22:27] to look like the irresponsible ible
[22:28] actor and and so they adopt this they
[22:31] adopt this as well when folks come to
[22:34] anthropic interpretability is often a
[22:35] draw and I tell them the other places
[22:37] you didn&amp;#39;t go tell them why you came
[22:39] here um and and then you see soon that
[22:43] there that there&amp;#39;s interpretability
[22:45] teams else elsewhere as well and in a
[22:47] way that takes away our competitive
[22:49] Advantage because it&amp;#39;s like oh they now
[22:52] others are doing it as well but it&amp;#39;s
[22:54] good it&amp;#39;s good for the broader system
[22:56] and so we have to invent some new thing
[22:57] that we&amp;#39;re doing others aren&amp;#39;t doing as
[22:59] well and the hope is to basically bid up
[23:02] bid up the importance of of of doing the
[23:05] right thing and it&amp;#39;s not it&amp;#39;s not about
[23:07] us in particular right it&amp;#39;s not about
[23:09] having one particular good guy other
[23:11] companies can do this as well if they if
[23:14] they if they join the race to do this
[23:15] that&amp;#39;s that&amp;#39;s you know that&amp;#39;s the best
[23:17] news ever right um uh it&amp;#39;s it&amp;#39;s just
[23:19] it&amp;#39;s about kind of shaping the
[23:21] incentives to point upward instead of
[23:23] shaping the incentives to point to point
[23:25] downward and we should say this example
[23:26] the field of uh mechanistic
[23:28] interpretability is just a a rigorous
[23:31] non handwavy way of doing AI safety yes
[23:34] or it&amp;#39;s tending that way trying to I
[23:37] mean I I think we&amp;#39;re still early um in
[23:39] terms of our ability to see things but
[23:41] I&amp;#39;ve been surprised at how much we&amp;#39;ve
[23:43] been able to look inside these systems
[23:45] and understand what we see right unlike
[23:48] with the scaling laws where it feels
[23:50] like there&amp;#39;s some you know law that&amp;#39;s
[23:52] driving these models to perform better
[23:55] on on the inside the models aren&amp;#39;t you
[23:57] know there&amp;#39;s no reason why they should
[23:58] be designed for us to understand them
[24:00] right they&amp;#39;re designed to operate
[24:01] they&amp;#39;re designed to work just like the
[24:03] human brain or human biochemistry
[24:05] they&amp;#39;re not designed for a human to open
[24:07] up the hatch look inside and understand
[24:09] them but we have found and you know you
[24:11] can talk in much more detail about this
[24:13] to Chris that when we open them up when
[24:15] we do look inside them we we find things
[24:18] that are surprisingly interesting and as
[24:20] a side effect you also get to see the
[24:21] beauty of these models you get to
[24:23] explore the sort of uh the beautiful n
[24:26] nature of large neural networks through
[24:28] the me turb kind ofy I&amp;#39;m amazed at how
[24:30] clean it&amp;#39;s been I I&amp;#39;m amazed at things
[24:33] like induction heads I&amp;#39;m amazed at
[24:36] things like uh you know that that we can
[24:39] you know use sparse autoencoders to find
[24:42] these directions within the networks uh
[24:45] and that the directions correspond to
[24:47] these very clear Concepts we
[24:49] demonstrated this a bit with the Golden
[24:51] Gate Bridge clad so this was an
[24:52] experiment where we found a direction
[24:55] inside one of the the neural network
[24:57] layers that corresponded to the Golden
[24:59] Gate Bridge and we just turned that way
[25:01] up and so we we released this model as a
[25:04] demo it was kind of half a joke uh for a
[25:06] couple days uh but it was it was
[25:08] illustrative of of the method we
[25:10] developed and uh you could you could
[25:12] take the Golden Gate you could take the
[25:14] model you could ask it about anything
[25:16] you know you know it would be like how
[25:18] you could say how was your day and
[25:19] anything you asked because this feature
[25:21] was activated would connect to the
[25:22] Golden Gate Bridge so it would say you
[25:24] know I&amp;#39;m I&amp;#39;m I&amp;#39;m feeling relaxed and
[25:26] expansive much like the the arches of
[25:28] the Golden Gate Bridge or you know it
[25:31] would masterfully change topic to the
[25:33] Golden Gate Bridge and it integrated
[25:35] there was also a sadness to it to to the
[25:37] focus ah had on the Golden Gate Bridge I
[25:38] think people quickly fell in love with
[25:40] it I think so people already miss it
[25:43] because it was taken down I think after
[25:45] a day somehow these interventions on the
[25:47] model um where where where where you
[25:50] kind of adjust Its Behavior somehow
[25:52] emotionally made it seem more human than
[25:55] any other version of the model strong
[25:57] personality strong ID strong personality
[25:59] it has these kind of like obsessive
[26:01] interests you know we can all think of
[26:03] someone who&amp;#39;s like obsessed with
[26:04] something so it does make it feel
[26:06] somehow a bit more human let&amp;#39;s talk
[26:08] about the present let&amp;#39;s talk about
[26:09] Claude so this year A lot has happened
[26:13] in March claw 3 Opa Sonet Hau were
[26:17] released then claw 35 Sonet in July with
[26:21] an updated version just now released and
[26:24] then also claw 35 hi coup was released
[26:27] okay can you explain the difference
[26:29] between Opus Sonet and Haiku and how we
[26:33] should think about the different
[26:34] versions yeah so let&amp;#39;s go back to March
[26:36] when we first released uh these three
[26:38] models so you know our thinking was you
[26:41] different companies produce kind of
[26:43] large and small models better and worse
[26:46] models we felt that there was demand
[26:49] both for a really powerful model um you
[26:52] know and you that might be a little bit
[26:54] slower that you&amp;#39;d have to pay more for
[26:56] and also for fast cheap models that are
[27:00] as smart as they can be for how fast and
[27:02] cheap right whenever you want to do some
[27:04] kind of like you know difficult analysis
[27:07] like if I you know I want to write code
[27:08] for instance or you know I want to I
[27:10] want to brainstorm ideas or I want to do
[27:12] creative writing I want the really
[27:14] powerful model but then there&amp;#39;s a lot of
[27:16] practical applications in a business
[27:18] sense where it&amp;#39;s like I&amp;#39;m interacting
[27:20] with a website I you know like I&amp;#39;m like
[27:23] doing my taxes or I&amp;#39;m you know talking
[27:25] to uh you know to like a legal adviser
[27:27] and I want to analyze a contract or you
[27:30] know we have plenty of companies that
[27:31] are just like you know you know I want
[27:33] to do autocomplete on my on my IDE or
[27:36] something uh and and for all of those
[27:38] things you want to act fast and you want
[27:40] to use the model very broadly so we
[27:42] wanted to serve that whole spectrum of
[27:45] needs um so we ended up with this uh you
[27:48] know this kind of poetry theme and so
[27:50] what&amp;#39;s a really short poem it&amp;#39;s a Haik
[27:51] cou and so Haiku is the small fast cheap
[27:55] model that is you know was at the time
[27:57] was released surprisingly surprisingly
[28:00] uh intelligent for how fast and cheap it
[28:02] was uh sonnet is a is a medium-sized
[28:05] poem right a couple paragraphs since o
[28:06] Sonet was the middle model it is smarter
[28:09] but also a little bit slower a little
[28:11] bit more expensive and and Opus like a
[28:13] magnum opus is a large work uh Opus was
[28:16] the the largest smartest model at the
[28:19] time um so that that was the original
[28:21] kind of thinking behind it um and our
[28:26] our thinking then was well each new
[28:27] generation of models should shift that
[28:29] tradeoff curve uh so when we release
[28:32] Sonet 3.5 it has the same roughly the
[28:35] same you know cost and speed as the
[28:39] Sonet 3 Model uh but uh it it increased
[28:45] its intelligence to the point where it
[28:47] was smarter than the original Opus 3
[28:49] Model uh especially for code but but
[28:52] also just in general and so now you know
[28:55] we&amp;#39;ve shown results for a Hau 3. 5 and I
[28:59] believe Hau 3.5 the smallest new model
[29:02] is about as good as Opus 3 the largest
[29:06] old model so basically the aim here is
[29:08] to shift the curve and then at some
[29:10] point there&amp;#39;s going to be an opus 3.5 um
[29:13] now every new generation of models has
[29:15] its own thing they use new data their
[29:17] personality changes in ways that we kind
[29:20] of you know try to steer but are not
[29:23] fully able to steer and and so uh
[29:25] there&amp;#39;s never quite that exact
[29:27] equivalence the only thing you&amp;#39;re
[29:28] changing is intelligence um we always
[29:30] try and improve other things and some
[29:32] things change without us without us
[29:34] knowing or measuring so it&amp;#39;s it&amp;#39;s very
[29:36] much an inexact science in many ways the
[29:40] manner and personality of these models
[29:42] is more an art than it is a science so
[29:45] what is sort of the reason for uh the
[29:50] span of time between say Claude Opus 3
[29:54] and 35 what is it what takes that time
[29:57] if you can speak to yeah so there&amp;#39;s
[29:59] there&amp;#39;s different there&amp;#39;s different uh
`;

// Note: This test file is for manually inspecting and comparing the results of different partition sizes
// We are looking at:
// 1. Processing time for different partition counts
// 2. Quality and coherence of responses across partition boundaries
// 3. Word count and content coverage
// 4. Any potential issues or artifacts from the partitioning

// The results will be logged to the console for manual review and analysis
// See the beforeAll() block below for the actual test execution and metrics collection
describe('LLM Partition Optimization Tests', () => {
  const llmUtils = new LLM_API_Utils();
  const MODEL_NAME = 'gpt-4o-mini';
  // Currently it looks the more paritions, the faster and more accurate. I'm stopping at 10 because anything more seems overkill.
  const PARTITION_SIZES = [8, 10, 12];

  beforeAll(async () => {
    console.log('\nPartition Comparison Results');
    console.log('==========================\n');

    for (const partitions of PARTITION_SIZES) {
      console.log(`Testing with ${partitions} partitions...`);
      console.log('----------------------------------------');

      const startTime = Date.now();
      const processedTranscript = await llmUtils.processTranscriptInParallel({
        transcript: testTranscript,
        model_name: MODEL_NAME,
        partitions
      });
      const endTime = Date.now();

      console.log('\nProcessed Response:');
      console.log(processedTranscript);
      console.log('\nMetrics:');
      console.log(`- Word count: ${processedTranscript.split(/\s+/).length} words`);
      console.log(`- Processing time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
      console.log('\n----------------------------------------\n');
    }
  }, 600000); // 10 minutes timeout

  test('Placeholder test to satisfy jest', () => {
    expect(true).toBe(true);
  });
}); 