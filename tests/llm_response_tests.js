import LLM_API_Utils from '../popup/llm_api_utils.js';

const llmUtils = new LLM_API_Utils();

// Sample test transcript segment
const testTranscript = `
Joe Rogan Experience #2219 - Donald Trump
[00:01] Joe Rogan podcast check it out The Joe
[00:04] Rogan Experience Train by day Joe Rogan
[00:07] podcast by night all
[00:11] day all right we&amp;#39;re rolling good to see
[00:14] you sir here we
[00:16] go um one of the things I wanted to talk
[00:18] to you about I wanted to play this but
[00:21] we decided we shouldn&amp;#39;t play it because
[00:23] uh it could get copyright strike and we
[00:25] don&amp;#39;t want to get the episode we don&amp;#39;t
[00:27] want anybody to have any sort of a way
[00:29] to get it down sure but it was the
[00:32] episode of you when you&amp;#39;re on The View
[00:34] and I think it was 2015 or6 like when
[00:38] you were running for president right and
[00:41] you sat you got introduced as our friend
[00:44] Donald Trump that&amp;#39;s right whoopy
[00:46] Goldberg gives you a big hug and a kiss
[00:48] Joy bayar gives you a big hug Barbara
[00:51] Walters gives you a big hug they all
[00:53] loved you they were all talking about
[00:56] how your uh you might be
[01:00] you might be conservative in your
[01:03] financial positions but you&amp;#39;re very
[01:05] liberal socially they were they&amp;#39;re
[01:07] talking about you in such a favorable
[01:09] light the audience was
[01:12] cheering and then you actually started
[01:14] winning in the polls and then the
[01:16] machine started working towards you yeah
[01:19] but it&amp;#39;s there&amp;#39;s probably no one in
[01:22] history that I&amp;#39;ve ever seen that&amp;#39;s been
[01:25] attacked the way you&amp;#39;ve been attacked
[01:27] and the way they&amp;#39;ve done it so coord at
[01:30] and systematically when you see those
[01:32] same people in the past very favorable
[01:34] to you like Oprah when you were on Oprah
[01:36] Show she was encouraging you last week I
[01:39] did one of our last shows I think maybe
[01:41] Thursday or Friday that was a big deal
[01:43] being on Oprah&amp;#39;s show the last one and I
[01:45] was like one of the last shows in that
[01:47] last that final week and I said boy
[01:50] we&amp;#39;ve come a long way since since that
[01:53] what was it like uh well the concept it
[01:56] was really like two different lives you
[01:58] know I had a a very wonderful life but I
[02:01] I wanted to do this The Apprentice was
[02:02] still going very strong we had 12
[02:05] seasons and uh we had actually uh 14
[02:09] Seasons 12 years over they had a couple
[02:11] of well they canceled the Apprentice
[02:12] when you were running for president
[02:14] correct no they had Arnold SCH a
[02:16] do it I was involved in that and I want
[02:19] I I had enough of it and we did great it
[02:21] was doing great but they wanted me to
[02:24] stay they all came to see me they said
[02:26] we&amp;#39;re going to give you a contract they
[02:27] wanted to extend my contract Mark
[02:29] Bernett is a great guy and they wanted
[02:31] to extend the contract Mark said you&amp;#39;re
[02:33] crazy don&amp;#39;t run don&amp;#39;t run no nobody
[02:36] gives up prime time they said you know
[02:37] it&amp;#39;s one of those little things which is
[02:39] probably true nobody gives a prime time
[02:41] though for being president for for
[02:43] running well for running against 20 some
[02:46] people you know turned out to be 18 18
[02:49] professional people you know mostly
[02:50] politicians they said who would do this
[02:53] I mean it&amp;#39;s a long shot actually the
[02:54] heads of NBC came over the uh Paul tgy
[02:58] all the all the top people came over to
[03:00] see me try and talk me out of it because
[03:01] they wanted to have me extend The
[03:03] Apprentice was doing well so it was 14
[03:06] Seasons it was 12 years we had one two
[03:09] seasons where we had a double which
[03:11] rarely happens it was just a hot show
[03:13] and uh I said you know I want to do this
[03:16] what happened is uh previously like
[03:19] three years four years before that they
[03:21] did a poll they had Mitt Romney and
[03:23] somehow they put me in a poll and I blew
[03:26] everybody away I blew him away which
[03:28] isn&amp;#39;t that hard frankly but I blew
[03:30] everybody away and I said that&amp;#39;s
[03:31] interesting because I never really gave
[03:33] it that much real thought I thought
[03:35] about it but never real thought but I
[03:36] saw these polls were very good and so I
[03:39] was thinking about doing it then but I
[03:40] had a contract with the Apprentice plus
[03:42] I was building two big buildings at the
[03:44] time and I wanted to make sure they got
[03:45] finished up properly and it was one of
[03:47] those things the kids were just sort of
[03:49] getting involved they&amp;#39;re very capable
[03:51] kids but they were getting involved
[03:52] early on so I did that I got them done I
[03:55] had some very good successes and I came
[03:58] on and then I thought about it for the
[04:00] next one after the Romney disaster and I
[04:04] ran and I won against Hillary it was
[04:07] quite an experience but it was a
[04:09] different life because you&amp;#39;re right the
[04:11] view I was on The View many many times
[04:13] and uh they loved me just the way people
[04:16] would talk I mean even if people had
[04:17] criticisms about you people that didn&amp;#39;t
[04:19] like you there was always feuds and
[04:21] stuff like that but the reality was the
[04:24] thing turned on you when they found out
[04:26] that you were going to be president it
[04:27] was very coordinated and some people are
[04:30] catching on to that now there&amp;#39;s a lot of
[04:32] people that were longtime Democrats like
[04:34] Elon and Bill Amman and all these
[04:37] different very intelligent people and
[04:38] they support me now Bill supports me
[04:40] he&amp;#39;s been very supportive too what this
[04:42] is what I wanted to ask you what was it
[04:45] like when you actually got in CU nobody
[04:47] really can prepare you for that when
[04:49] you&amp;#39;re running for president you don&amp;#39;t
[04:50] really know what it&amp;#39;s going to be like
[04:52] when you actually get into office what
[04:54] was the what did you think it was going
[04:56] to be like in office or when I decided
[04:58] to run so no when you got in when I was
[05:00] in so when I was in and one and was in
[05:03] the White House essentially well first
[05:06] of all it was very surreal oh you know
[05:08] it&amp;#39;s very interesting when I got shot it
[05:10] wasn&amp;#39;t surreal that should have been
[05:12] surreal when I was laying on the ground
[05:13] I knew exactly what was going on I knew
[05:15] exactly where I was hit they were saying
[05:18] you were hit all over the place because
[05:20] there was so much blood from the ear you
[05:22] would know that better than anyone when
[05:23] they get the ear torn up ear bleed a lot
[05:25] bleed anyway so and and I was thinking
[05:29] the other day
[05:30] when when that happened I really knew
[05:32] where I was I knew exactly what happened
[05:35] I said I wasn&amp;#39;t hit anywhere else with
[05:37] the with the presidency it was a very
[05:40] surreal experience okay and what&amp;#39;s day
[05:43] one like you win you get inaugurated
[05:46] holy I&amp;#39;m the president yeah that&amp;#39;s
[05:48] what happened so I&amp;#39;m driving down
[05:49] Pennsylvania Avenue I just built a
[05:51] building on pen you know the hotel the
[05:53] old post office it was we called it
[05:55] Trump
[05:56] National uh hotel and we sold it to the
[06:00] Waldorf Historia and it was a wonderful
[06:03] thing but I&amp;#39;m driving down I&amp;#39;m passing
[06:04] the hotel you&amp;#39;ve never seen so many
[06:07] motorcycles police
[06:09] military you know it was a major thing I
[06:12] got off really the first time I used Air
[06:15] Force One landed and we&amp;#39;re coming down
[06:18] and they were it was very be I mean it
[06:21] was incredible and we&amp;#39;re going down
[06:23] Pennsylvania Avenue in the opposite
[06:24] direction you know normally you&amp;#39;re used
[06:26] to going one way and all of a sudden
[06:28] you&amp;#39;re going the other way the street
[06:30] was loaded up and I wanted to go out and
[06:33] I wanted to wave to everybody but that
[06:35] wasn&amp;#39;t smart you know that KS a little
[06:38] bit dangerous right I mean when you
[06:40] watch like Kennedy and some others right
[06:43] but I really felt I don&amp;#39;t know the love
[06:45] was so crazy and so I did get out of the
[06:49] car for a brief you know just for a very
[06:50] short walk I thought it was very
[06:52] important to do and milania got out with
[06:54] her beautiful dress on that became sort
[06:56] of a staple it was uh people loved it
[06:59] and
[07:00] Baron and we&amp;#39;re walking down the street
[07:03] but where it really got amazing we get
[07:06] to the White House and now it&amp;#39;s a little
[07:09] bit uh little bit before dark
[07:11] beautiful and we went up to the
[07:14] president&amp;#39;s quarters they call them the
[07:16] presidential quarters and I&amp;#39;m standing
[07:20] in this beautiful hallway I you know
[07:22] it&amp;#39;s funny nobody ever talks about the
[07:24] White House as being beautiful inside
[07:26] you know you think it&amp;#39;s going to be
[07:27] everything&amp;#39;s going to be all metal doors
[07:29] and stuff it&amp;#39;s not it&amp;#39;s so beautiful I
[07:32] made my money largely on luxury the
[07:35] hallway is like 25 ft wide the ceiling
[07:38] Heights are you every it&amp;#39;s so beautiful
[07:41] but I was standing there and I said to
[07:44] the guys I want to see the Lincoln
[07:45] bedroom I had never seen the Lincoln
[07:47] bedroom I&amp;#39;d heard about the Lincoln
[07:49] bedroom and I was standing with my wife
[07:53] I said Do you believe it this is the
[07:54] Lincoln bedroom I mean it was like it
[07:59] was it was amazing because it&amp;#39;s look if
[08:03] you love the country but here you are
[08:05] the Lincoln bedroom and the bed you know
[08:08] he was very tall he was 6&amp;#39;6 which then
[08:10] would be like like Baron right would be
[08:13] like Baron Trump he&amp;#39;s 69 but 6&amp;#39;6 he was
[08:18] very tall then on top of that he wore
[08:19] there it is he wore that yeah there it
[08:21] is it&amp;#39;s a long bed elongated bed and
[08:24] because very you know people were
[08:26] shorter than you see some of the chairs
[08:28] are very very low to the ground actually
[08:31] but he had the long bed and they had uh
[08:35] you had the Gettysburg Address right on
[08:37] that right under that you can&amp;#39;t see it
[08:39] here but right there the original
[08:40] version of the Gettysburg address and
[08:43] this is the original and I&amp;#39;m looking and
[08:45] I just looked around I said Do you
[08:48] believe this because I was never a pol
[08:51] first of even if you were a politician
[08:52] but I was never a politician it just I
[08:54] sort of just started right and all of a
[08:57] sudden I&amp;#39;m standing in the White House
[08:58] and it was uh very very surreal that
[09:01] room was so beautiful to me much more
[09:03] beautiful than it actually is you know
[09:05] to me when I looked at the bed and the
[09:07] bed you could see was a little bit
[09:08] longer had to be a little bit longer uh
[09:11] he lost his son and they suffered the
[09:14] two of them suffered from melancolia
[09:16] they didn&amp;#39;t call it depression they
[09:18] called it melancolia and they suffered
[09:21] from it he was a very depressed guy and
[09:24] she was a very depressed woman more so
[09:27] than him and on top of that they lost
[09:29] their son whose name was Tad Tad and uh
[09:35] it was uh just seeing it in the little
[09:38] picture a little tiny picture I mean you
[09:40] can&amp;#39;t see the details there little tiny
[09:42] everything the W was a little tiny
[09:44] picture of Tad who he lost and it was
[09:49] devastating and he was you know he was a
[09:52] look he was in a war he was he and he
[09:55] was having a hard time because he
[09:56] couldn&amp;#39;t beat Robert E Lee Robert E Lee
[09:58] won like 13 battles in a row and he was
[10:01] getting like a phobia like a fighter you
[10:03] know a lot about the fight stuff but
[10:06] like I went to a UFC fight and it was a
[10:11] champion who was 14- one about a year
[10:14] ago you would know the names 14 and one
[10:17] and the only guy he lost to was this one
[10:18] guy but the guy that he was fighting was
[10:21] like almost just an average fighter lost
[10:24] numerous times but he beat this one guy
[10:27] so I said okay I really don&amp;#39;t know who
[10:29] you&amp;#39;re talking abouty I I will figure it
[10:31] out okay but about a year ago but the
[10:33] point is that he lost he wasn&amp;#39;t nearly
[10:35] the fighter as the but the one who was
[10:38] not nearly the fighter had beaten he&amp;#39;s
[10:40] the only guy that beat the the champ
[10:42] like five years before and I said I&amp;#39;ll
[10:45] take the guy that won the other fight
[10:47] and that&amp;#39;s what happened he beat him a
[10:48] second time sometimes psychological
[10:50] advantage is this crazy thing uh Lincoln
[10:54] had a I don&amp;#39;t know I&amp;#39;ve never read this
[10:56] I heard it from people in the way house
[11:00] who really understand what was going on
[11:02] with with the whole life of the White
[11:04] House but Lincoln had uh The Yips about
[11:08] in a way as the golfers would say he had
[11:10] a phobia about Robert El Lee said I
[11:12] can&amp;#39;t beat Robert because Robert E Lee
[11:15] won many battles in a row he was just
[11:17] beating the hell out of you know they
[11:18] tried to get Robert Elite to be on the
[11:20] north but he said no I have to be with
[11:22] my state you know the state was his
[11:24] whole thing and and he went to the South
[11:27] and he was uh I&amp;#39;ve had generals tell me
[11:30] we have some great generals the real
[11:31] generals not the ones you see on
[11:32] television the ones that beat Isis with
[11:35] me we defeated Isis and record time it
[11:37] was supposed to take years and we did it
[11:40] in a matter of weeks he&amp;#39;s are great
[11:42] generals he&amp;#39;s a tough guys he&amp;#39;s a not
[11:44] woke guys but their favorite General in
[11:48] terms of Genius was Robert El Le
[11:51] strategy strategy strategically he took
[11:53] a war that should have been over in a
[11:56] few days and it was you know years of
[11:59] head hell a vicious war and um so here I
[12:04] am standing there and again I had never
[12:08] really done this before you know I ran I
[12:09] ran a number of months before I won I
[12:13] probably uh I guess if you figured Max
[12:16] it out it would be a year something like
[12:19] that so I had never run for office and I
[12:22] did well I mean I I went into debates we
[12:25] had 18 people including me and then
[12:27] slowly but surely they started to
[12:29] disappear we had debates good debates
[12:32] everyone&amp;#39;s aware of all this stuff but
[12:33] what I want to get to is like what was
[12:34] the experience once you got inside like
[12:37] what did you think it was going to be
[12:38] like in terms of like your ability to
[12:40] govern like this is your first
[12:42] experience governing anything you never
[12:44] been a govern you never been a mayor
[12:46] private private stuff business but now
[12:49] all of a sudden you&amp;#39;re inside the White
[12:50] House the biggest thing was just that
[12:52] first moment of being in this hallowed
[12:55] it was really a hallowed place to me it
[12:57] was it was beyond to me that&amp;#39;s that was
[12:59] the experience it was a surreal
[13:01] experience and then with time that wears
[13:05] off with time it becomes you know your
[13:07] place where you stay and right uh I was
[13:10] doing a lot of I was I had two things
[13:13] that I really focused on governing the
[13:15] country and uh
[13:18] survival because from the moment I won
[13:22] before I got to office all of a sudden
[13:24] it I mean they came down I mean nobody
[13:27] has ever been treated that way
[13:30] and and you see that I mean you see
[13:31] we&amp;#39;re in the Washington Post very early
[13:33] on they said well now the impeachment
[13:35] stuff starts and it did I mean it
[13:36] literally started from the beginning so
[13:38] I had survival and run the nation I had
[13:40] a a combination most people don&amp;#39;t have
[13:42] the survival they get in uh what did you
[13:46] expect though in terms of like once you
[13:48] got inside you had to appoint all these
[13:50] people like how many appointments did
[13:52] you have to make you have you actually
[13:54] 10,000 uh appointments now they&amp;#39;re
[13:57] different you know you have big ones and
[13:58] then they appoint right 100 people and
[14:00] 200 people and but the president really
[14:03] is is involved with approximately 10,000
[14:06] appointments so you&amp;#39;ll appoint a
[14:08] secretary of state and he will he or she
[14:10] will appoint a lot of people so it&amp;#39;s a
[14:11] lot but in terms of major ones you
[14:14] probably have like a h 100 but they&amp;#39;re
[14:15] big ones uh treasury State uh military
[14:21] and how did you know who to a point well
[14:24] I I didn&amp;#39;t I had no experience you have
[14:26] to understand I was there 17 times in
[14:29] Washington and I never stayed over
[14:31] according to the Press which I think is
[14:32] probably right over the years I was only
[14:35] there 17 times I never stayed over so
[14:38] now I&amp;#39;m sitting there I&amp;#39;m saying this
[14:41] place is gorgeous but you know I don&amp;#39;t
[14:42] know anybody it&amp;#39;s like you you you know
[14:44] you go to certain areas and other areas
[14:47] they may be great Washington was great
[14:49] Washington&amp;#39;s not so great right now
[14:51] they&amp;#39;re got to we got to fix it we got
[14:52] to make it better we got to make it
[14:54] better better we&amp;#39;re going to bring it
[14:59] back but I wasn&amp;#39;t a Washington guy I was
`;

describe('LLM Response Unit Tests', () => {
  let response;

  beforeAll(async () => {
    response = await llmUtils.call_llm({ model_name: 'gpt-4o-mini', prompt: testTranscript });
  });

  test('Response preserves key technical terms', () => {
    const technicalTerms = [
      'Apprentice', // [02:02]
      'president', // [02:12] 
      'contract', // [02:26]
      'military', // [06:09]
      'surreal', // [05:06]
      'melancolia', // [09:16]
      'strategy', // [11:51]
      'appointments', // [13:54]
      'treasury', // [14:15]
      'Washington' // [14:49]
    ];

    const lowerResponse = response.toLowerCase();
    const foundTerms = technicalTerms.filter(term => lowerResponse.includes(term.toLowerCase()));
    
    // Should preserve at least 80% of technical terms
    expect(foundTerms.length).toBeGreaterThanOrEqual(Math.ceil(technicalTerms.length * 0.8));
  });

  test('Response contains timestamps', () => {
    // Example format: [13:31 -> 13:35]
    expect(response).toMatch(/\[\d{2}:\d{2}\s*->\s*\d{2}:\d{2}\]/);
  });

  test('Response contains multiple timestamp ranges', () => {
    // Example of correct response:
    // [13:40 -> 13:42]
    // [13:42 -> 13:46] 
    // [13:46 -> 13:48]

    // Examples of incorrect responses:
    // [13:40] (missing end time)
    // [13:42->13:40] (end time before start time)
    // [13:48 -> 13:46] (timestamps out of order)

    const timeRanges = response.match(/\[\d{2}:\d{2}\s*->\s*\d{2}:\d{2}\]/g);
    expect(timeRanges).toBeTruthy();
    expect(timeRanges.length).toBeGreaterThan(1);

    // Check timestamps are sequential
    const timestamps = timeRanges.map(range => {
      const [start, end] = range.match(/\d{2}:\d{2}/g);
      return {
        start: convertToSeconds(start),
        end: convertToSeconds(end)
      };
    });

    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].start).toBeGreaterThanOrEqual(timestamps[i - 1].end);
    }
  });

  test('Response identifies speakers', () => {
    expect(response).toMatch(/[A-Za-z\s]+:/);
  });

  test('Response has consistent speaker attribution', () => {
    const speakerLines = response.match(/^[^[\n]+:/gm);
    expect(speakerLines).toBeTruthy();
    expect(speakerLines.length).toBeGreaterThan(1);

    // Get unique speakers
    const speakers = new Set(speakerLines.map(line => line.trim()));

    // Should have at least 2 speakers (host and guest)
    expect(speakers.size).toBeGreaterThanOrEqual(2);

    // Check for consistent naming (no "Speaker 1" mixing with actual names)
    const hasGenericSpeakers = Array.from(speakers).some(speaker =>
      speaker.includes('Speaker') || speaker.includes('Host') || speaker.includes('Guest')
    );
    const hasNamedSpeakers = Array.from(speakers).some(speaker =>
      !speaker.includes('Speaker') && !speaker.includes('Host') && !speaker.includes('Guest')
    );

    // Should not mix generic and named speakers
    expect(hasGenericSpeakers && hasNamedSpeakers).toBeFalsy();
  });

  test('Response covers entire time range', () => {
    const firstTimestamp = response.match(/\[(\d{2}:\d{2})/)[1];
    const lastTimestamp = response.match(/->\\s*(\\d{2}:\\d{2})\]/)[1];

    const getSeconds = (timestamp) => {
      const [mins, secs] = timestamp.split(':').map(Number);
      return mins * 60 + secs;
    };

    expect(getSeconds(firstTimestamp)).toBeLessThanOrEqual(5);
    expect(getSeconds(lastTimestamp)).toBeGreaterThanOrEqual(15);
  });

  test('Response covers entire time range', () => {
    // Extract first and last timestamps
    const allTimestamps = response.match(/\d{2}:\d{2}/g);
    const firstTimestamp = convertToSeconds(allTimestamps[0]);
    const lastTimestamp = convertToSeconds(allTimestamps[allTimestamps.length - 1]);

    // Check if it covers the full range from input
    const inputFirstTime = convertToSeconds('00:00');
    const inputLastTime = convertToSeconds('00:40');

    expect(firstTimestamp).toBeLessThanOrEqual(inputFirstTime + 5); // Allow 5 seconds flexibility
    expect(lastTimestamp).toBeGreaterThanOrEqual(inputLastTime - 5); // Allow 5 seconds flexibility
  });

  test('Response maintains key information', () => {
    const keyTerms = ['machine learning', 'neural networks', 'deep learning'];
    keyTerms.forEach(term => {
      expect(response.toLowerCase()).toContain(term);
    });
  });

  // Helper function to convert timestamp to seconds
  function convertToSeconds(timestamp) {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
  }
});

describe('LLM Quality Assessment Tests', () => {
  const evaluationPrompt = `
  You are a professional transcript quality assessor. Evaluate the following transcript based on these criteria:
  1. Clarity (1-10): How clear and readable is the text?
  2. Speaker Attribution (1-10): How well are speakers identified and distinguished?
  3. Professional Polish (1-10): How well has casual speech been converted to professional text?
  4. Content Preservation (1-10): How well is the original meaning preserved?
  
  Provide scores and brief justification for each criterion.
  
  Original transcript:
  ${testTranscript}
  
  Processed transcript:
  {{PROCESSED_TRANSCRIPT}}
  
  Respond in this format:
  {
    "clarity": {"score": X, "justification": "..."},
    "speaker_attribution": {"score": X, "justification": "..."},
    "professional_polish": {"score": X, "justification": "..."},
    "content_preservation": {"score": X, "justification": "..."},
    "overall_score": X,
    "suggestions": "..."
  }
  `;

  test('Quality assessment meets minimum standards', async () => {
    const processedTranscript = await llmUtils.call_llm('claude-3-sonnet', systemRole, testTranscript);
    const evaluation = await llmUtils.call_llm(
      'claude-3-sonnet',
      'You are a transcript quality assessor.',
      evaluationPrompt.replace('{{PROCESSED_TRANSCRIPT}}', processedTranscript)
    );

    const scores = JSON.parse(evaluation);

    // Define minimum acceptable scores
    const MINIMUM_SCORES = {
      clarity: 7,
      speaker_attribution: 7,
      professional_polish: 7,
      content_preservation: 8,
      overall_score: 7.5
    };

    // Check each criterion meets minimum standards
    Object.entries(MINIMUM_SCORES).forEach(([criterion, minScore]) => {
      const actualScore = scores[criterion].score || scores[criterion];
      expect(actualScore).toBeGreaterThanOrEqual(minScore);
    });

    // Ensure suggestions are provided
    expect(scores.suggestions).toBeTruthy();
    expect(scores.suggestions.length).toBeGreaterThan(20);
  });
});

// Helper function to compare different prompt versions
async function comparePrompts(originalPrompt, newPrompt, testCases) {
  const results = [];

  for (const testCase of testCases) {
    const originalResponse = await llmUtils.call_llm('claude-3-sonnet', originalPrompt, testCase);
    const newResponse = await llmUtils.call_llm('claude-3-sonnet', newPrompt, testCase);

    // Get quality assessments for both responses
    const originalAssessment = await llmUtils.call_llm(
      'claude-3-sonnet',
      'You are a transcript quality assessor.',
      evaluationPrompt.replace('{{PROCESSED_TRANSCRIPT}}', originalResponse)
    );

    const newAssessment = await llmUtils.call_llm(
      'claude-3-sonnet',
      'You are a transcript quality assessor.',
      evaluationPrompt.replace('{{PROCESSED_TRANSCRIPT}}', newResponse)
    );

    results.push({
      testCase,
      originalScore: JSON.parse(originalAssessment).overall_score,
      newScore: JSON.parse(newAssessment).overall_score,
      improvement: JSON.parse(newAssessment).overall_score - JSON.parse(originalAssessment).overall_score
    });
  }

  return results;
}