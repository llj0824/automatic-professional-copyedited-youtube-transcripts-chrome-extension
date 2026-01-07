import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';

test('parseTranscriptContext uses shortDescription when present', () => {
  const result = YoutubeTranscriptRetriever.parseTranscriptContext({
    videoDetails: {
      title: 'Sample Title',
      shortDescription: 'Intro line.\n\n0:10 Chapter one\n1:20 Chapter two'
    }
  });

  expect(result).toContain('Title: Sample Title');
  expect(result).toContain('Description: Intro line.');
  expect(result).toContain('Timestamps:');
  expect(result).toContain('0:10 Chapter one');
});

test('parseTranscriptContext falls back to microformat description', () => {
  const result = YoutubeTranscriptRetriever.parseTranscriptContext({
    videoDetails: {},
    microformat: {
      title: { simpleText: 'Microformat Title' },
      description: { simpleText: 'Line one.\n\n2:00 Chapter A' }
    }
  });

  expect(result).toContain('Title: Microformat Title');
  expect(result).toContain('Description: Line one.');
  expect(result).toContain('2:00 Chapter A');
});

test('parseTranscriptContext handles missing description', () => {
  const result = YoutubeTranscriptRetriever.parseTranscriptContext({
    videoDetails: { title: 'No Description Title' },
    microformat: {}
  });

  expect(result).toContain('Title: No Description Title');
  expect(result).toContain('Description: No description available');
});
