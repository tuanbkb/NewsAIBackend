const { JSDOM } = require('jsdom');

const STOPWORDS_VI = [
  'a',
  'ai',
  'anh',
  'bao',
  'bao nhiêu',
  'bay',
  'biết',
  'biết bao',
  'biết bao nhiêu',
  'bây',
  'các',
  'cái',
  'cả',
  'càng',
  'chỉ',
  'chiếc',
  'cho',
  'chứ',
  'chưa',
  'chuyện',
  'coi',
  'có',
  'có thể',
  'cứ',
  'của',
  'cùng',
  'cũng',
  'đã',
  'đang',
  'đây',
  'để',
  'đến',
  'đều',
  'đi',
  'được',
  'dù',
  'gì',
  'gần',
  'gồm',
  'hay',
  'hơn',
  'họ',
  'hồi',
  'hôm',
  'hôm nay',
  'hãy',
  'khi',
  'không',
  'là',
  'lại',
  'lên',
  'lúc',
  'mà',
  'mình',
  'mỗi',
  'một',
  'này',
  'nào',
  'này nọ',
  'nên',
  'nếu',
  'ngay',
  'nhiều',
  'như',
  'nhưng',
  'những',
  'nó',
  'nơi',
  'nữa',
  'phải',
  'qua',
  'ra',
  'rằng',
  'rất',
  'rồi',
  'sao',
  'sau',
  'sẽ',
  'so',
  'sự',
  'tại',
  'theo',
  'thì',
  'trên',
  'trước',
  'từ',
  'từng',
  'tới',
  'tôi',
  'và',
  'vẫn',
  'vậy',
  'vì',
  'việc',
  'với',
  'vừa',
  'về',
  'xin',
  'y',
];

const STOPWORDS_VI_SET = new Set(STOPWORDS_VI);

const BLOCKED_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'canvas',
  'footer',
  'header',
  'nav',
  'aside',
  'button',
  'input',
  'textarea',
  'select',
  '.advert',
  '.ads',
  '.ad',
  '.sponsored',
  '.share',
  '.social',
  '.newsletter',
  '.subscribe',
  '.comments',
  '#comments',
];

const cleanText = (value = '') =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

const countStopwords = (text) => {
  if (!text) return 0;
  const words =
    text
      .toLowerCase()
      .normalize('NFC')
      .match(/[\p{L}\p{M}]+/gu) || [];
  if (!words.length) return 0;
  return words.reduce(
    (total, word) => (STOPWORDS_VI_SET.has(word) ? total + 1 : total),
    0,
  );
};

const nodeText = (node) => cleanText((node && node.textContent) || '');

const getNodeScore = (node) =>
  Number((node && node.dataset && node.dataset.gravityScore) || 0);

const setNodeScore = (node, score) => {
  if (!node) return;
  node.dataset.gravityScore = String(score);
};

const increaseNodeScore = (node, delta) => {
  if (!node) return;
  setNodeScore(node, getNodeScore(node) + delta);
};

const getNodeCount = (node) =>
  Number((node && node.dataset && node.dataset.gravityNodes) || 0);

const setNodeCount = (node, count) => {
  if (!node) return;
  node.dataset.gravityNodes = String(count);
};

const increaseNodeCount = (node, delta) => {
  if (!node) return;
  setNodeCount(node, getNodeCount(node) + delta);
};

const isHighLinkDensity = (node) => {
  if (!node) return false;

  const links = node.querySelectorAll('a');
  if (!links.length) return false;

  const text = nodeText(node);
  const words = text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word));
  if (!words.length) return true;

  const wordsNumber = words.length;
  const linkText = Array.from(links)
    .map((link) => nodeText(link))
    .join(' ');
  const linkWords = linkText.split(/\s+/).filter(Boolean);
  const numLinkWords = linkWords.length;
  const numLinks = links.length;

  const linkDivisor = numLinkWords / wordsNumber;
  const score = linkDivisor * numLinks;
  return score >= 1.0;
};

const isBoostable = (node) => {
  const minimumStopwordCount = 5;
  const maxSteps = 3;
  let steps = 0;

  let current = (node && node.previousElementSibling) || null;
  while (current) {
    if (current.tagName && current.tagName.toLowerCase() === 'p') {
      if (steps >= maxSteps) return false;
      const stopwordCount = countStopwords(nodeText(current));
      if (stopwordCount > minimumStopwordCount) return true;
      steps += 1;
    }
    current = current.previousElementSibling;
  }

  return false;
};

const getSiblingsScore = (topNode) => {
  if (!topNode) return 100000;
  const paragraphs = topNode.querySelectorAll('p');

  let count = 0;
  let score = 0;

  paragraphs.forEach((paragraph) => {
    const text = nodeText(paragraph);
    const stopwordCount = countStopwords(text);
    if (stopwordCount > 2 && !isHighLinkDensity(paragraph)) {
      count += 1;
      score += stopwordCount;
    }
  });

  return count > 0 ? score / count : 100000;
};

const extractSiblingParagraphs = (sibling, baselineScore) => {
  if (!sibling) return [];

  if (sibling.tagName && sibling.tagName.toLowerCase() === 'p') {
    const text = nodeText(sibling);
    return text ? [text] : [];
  }

  const paragraphs = sibling.querySelectorAll('p');
  const accepted = [];

  paragraphs.forEach((paragraph) => {
    const text = nodeText(paragraph);
    if (!text) return;

    const paragraphScore = countStopwords(text);
    const siblingBaselineScore = baselineScore * 0.3;
    if (
      paragraphScore > siblingBaselineScore &&
      !isHighLinkDensity(paragraph)
    ) {
      accepted.push(text);
    }
  });

  return accepted;
};

const normalizeParagraphs = (texts) => {
  const seen = new Set();
  return texts
    .map((text) => cleanText(text))
    .filter((text) => {
      if (!text || text.length < 20) return false;
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    });
};

const cleanDocument = (doc) => {
  BLOCKED_SELECTORS.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const all = doc.querySelectorAll('*');
  all.forEach((node) => {
    const classId = `${node.className || ''} ${node.id || ''}`.toLowerCase();
    if (
      /comment|footer|header|promo|advert|subscribe|social|related|cookie/.test(
        classId,
      )
    ) {
      node.remove();
    }
  });

  return doc;
};

const calculateBestNode = (doc) => {
  const candidates = Array.from(doc.querySelectorAll('p, pre, td'));
  const nodesWithText = [];

  candidates.forEach((node) => {
    const text = nodeText(node);
    const stopwordCount = countStopwords(text);
    if (stopwordCount > 2 && !isHighLinkDensity(node)) {
      nodesWithText.push(node);
    }
  });

  if (!nodesWithText.length) return null;

  let startingBoost = 1.0;
  let cnt = 0;
  const parentNodes = new Set();
  const nodesNumber = nodesWithText.length;
  const bottomNegativeNodes = nodesNumber * 0.25;
  const negativeScoring = 0;

  nodesWithText.forEach((node, index) => {
    let boostScore = 0;

    if (isBoostable(node) && cnt >= 0) {
      boostScore = (1.0 / startingBoost) * 50;
      startingBoost += 1;
    }

    if (nodesNumber > 15 && nodesNumber - index <= bottomNegativeNodes) {
      const booster = bottomNegativeNodes - (nodesNumber - index);
      boostScore = -(booster ** 2);
      const negScore = Math.abs(boostScore) + negativeScoring;
      if (negScore > 40) boostScore = 5;
    }

    const stopwordCount = countStopwords(nodeText(node));
    const upScore = Math.max(0, Math.floor(stopwordCount + boostScore));
    const parent = node.parentElement;

    if (parent) {
      increaseNodeScore(parent, upScore);
      increaseNodeCount(parent, 1);
      parentNodes.add(parent);

      const grandParent = parent.parentElement;
      if (grandParent) {
        increaseNodeCount(grandParent, 1);
        increaseNodeScore(grandParent, upScore / 2);
        parentNodes.add(grandParent);
      }
    }

    cnt += 1;
  });

  let topNode = null;
  let topNodeScore = 0;

  parentNodes.forEach((node) => {
    const score = getNodeScore(node);
    if (!topNode || score > topNodeScore) {
      topNode = node;
      topNodeScore = score;
    }
  });

  return topNode;
};

const postCleanupParagraphs = (topNode) => {
  if (!topNode) return [];

  const bodyParagraphs = Array.from(topNode.querySelectorAll('p')).map((p) =>
    nodeText(p),
  );
  const baseline = getSiblingsScore(topNode);

  const siblingParagraphs = [];
  let sibling = topNode.previousElementSibling;
  while (sibling) {
    siblingParagraphs.push(...extractSiblingParagraphs(sibling, baseline));
    sibling = sibling.previousElementSibling;
  }

  const merged = normalizeParagraphs([...siblingParagraphs, ...bodyParagraphs]);
  return merged;
};

const fallbackParagraphExtraction = (doc) => {
  const paragraphs = Array.from(doc.querySelectorAll('article p, main p, p'));
  return normalizeParagraphs(paragraphs.map((p) => nodeText(p))).join('\n\n');
};

const parseArticleMainContent = (html, options = {}) => {
  const { url = 'https://example.com/' } = options;

  if (!html || typeof html !== 'string') {
    return {
      text: '',
      articleHtml: '',
    };
  }

  const dom = new JSDOM(html, { url });
  const doc = cleanDocument(dom.window.document);

  const topNode = calculateBestNode(doc);
  if (!topNode) {
    const fallbackText = fallbackParagraphExtraction(doc);
    return {
      text: fallbackText,
      articleHtml: '',
    };
  }

  const paragraphs = postCleanupParagraphs(topNode);
  const text = paragraphs.join('\n\n').trim();

  return {
    text,
    articleHtml: topNode.innerHTML || '',
  };
};

module.exports = {
  parseArticleMainContent,
};
