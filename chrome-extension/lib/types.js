/**
 * @typedef {Object} SearchRequest
 * @property {string=} senderEmail
 * @property {string=} senderDomain
 * @property {string=} keywords
 * @property {number=} limit
 */

/**
 * @typedef {Object} ParsedEmail
 * @property {string} id
 * @property {string} threadId
 * @property {string=} historyId
 * @property {string=} internalDate
 * @property {number=} sizeEstimate
 * @property {string[]} labelIds
 * @property {string=} snippet
 * @property {Object.<string, string|undefined>} headers
 * @property {{textPlain?: string, textHtml?: string}} body
 * @property {{payloadMimeType?: string, parts?: Array<{mimeType?: string, filename?: string, bodySize?: number}>}} raw
 */

/**
 * @typedef {Object} SearchError
 * @property {string=} id
 * @property {number=} status
 * @property {string} message
 */

/**
 * @typedef {Object} SearchResponse
 * @property {string} query
 * @property {number} count
 * @property {ParsedEmail[]} messages
 * @property {string=} nextPageToken
 * @property {SearchError[]=} errors
 */

export {};
