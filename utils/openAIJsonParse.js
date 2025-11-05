module.exports = (aiResponse) => {
  try {
    let text = aiResponse.trim();
    text = text
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('❌ JSON parse error:', err.message);
    console.log('Raw content:', aiResponse);
    return null;
  }
};
