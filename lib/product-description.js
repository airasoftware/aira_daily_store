import sanitizeHtml from 'sanitize-html';

const allowedTags = ['p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'br', 'code', 'pre', 'hr', 'a'];
const options = {
  allowedTags,
  allowedAttributes: { p: ['style'], h2: ['style'], h3: ['style'], a: ['href', 'target', 'rel'] },
  allowedStyles: { p: { 'text-align': [/^(?:left|center|right)$/] }, h2: { 'text-align': [/^(?:left|center|right)$/] }, h3: { 'text-align': [/^(?:left|center|right)$/] } },
  allowedSchemes: ['http', 'https'],
  allowProtocolRelative: false,
  transformTags: { a: (_tag, attributes) => ({ tagName: 'a', attribs: { href: attributes.href, target: '_blank', rel: 'noopener noreferrer' } }) },
  disallowedTagsMode: 'discard',
};
const richTag = /<\/?(?:p|h[1-6]|ul|ol|li|strong|em|u|s|a|blockquote|br|pre|code|hr)\b/i;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function productDescriptionHtml(value) {
  const description = String(value ?? '').trim();
  if (!description) return '';
  if (richTag.test(description)) return sanitizeHtml(description, options);
  return description.split(/\n\s*\n/).map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
}
