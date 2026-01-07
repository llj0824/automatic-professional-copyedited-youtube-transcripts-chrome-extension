// tests/llm_partition_split.test.js

test('splitTranscriptForProcessing splits when transcript starts with delimiter', async () => {
  const { default: LLM_API_Utils } = await import('../popup/llm_api_utils.js');
  const llm = Object.create(LLM_API_Utils.prototype);

  const transcript = [
    '*** Transcript ***',
    '[00:00] Alpha',
    '[00:10] Beta',
    '[00:20] Gamma',
    '[00:30] Delta'
  ].join('\n');

  const parts = llm.splitTranscriptForProcessing(transcript, 2);

  expect(parts.length).toBe(2);
  expect(parts[0]).toContain('[00:00] Alpha');
  expect(parts[0]).toContain('[00:10] Beta');
  expect(parts[0]).not.toContain('[00:30] Delta');
  expect(parts[1]).toContain('[00:20] Gamma');
  expect(parts[1]).toContain('[00:30] Delta');
});
