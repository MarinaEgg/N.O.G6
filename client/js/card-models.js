/**
 * Card Data Models
 * 
 * This file contains the data structures used for cards in the application,
 * including the extended structure for iManage integration.
 */

/**
 * Base card interface that all card types must implement
 * @typedef {Object} BaseCardData
 * @property {string} id - Unique identifier for the card
 * @property {'text'|'file'|'email'} type - Type of the card
 * @property {string} title - Display title of the card
 * @property {Object} position - Position on the workspace
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 * @property {boolean} [pinned=false] - Whether the card is pinned in place
 * @property {string} [clientLevel] - Client level (iManage Custom1)
 * @property {string} [workspaceLevel] - Workspace/Dossier level (iManage Custom2)
 * @property {string[]} [folders=[]] - Folders/tags for the document
 */

/**
 * Extended card data structure with iManage integration
 * @typedef {BaseCardData} ExtendedCardData
 * @property {string} [iManageId] - iManage document ID
 * @property {string} [iManageVersion] - Document version in iManage
 * @property {'word'|'pdf'|'email'|'excel'|'other'} [documentType] - Type of document
 * @property {string} [author] - Document author/creator
 * @property {string} [lastModified] - ISO timestamp of last modification
 * @property {number} [size] - File size in bytes
 * @property {'Confidential'|'Public'|'Restricted'|'Internal'} [classification='Internal'] - Document classification
 * @property {'synced'|'modified'|'conflict'|'pending'} [syncStatus='synced'] - Sync status with iManage
 * @property {string} [lastSync] - ISO timestamp of last sync
 * @property {Object} [metadata] - Additional metadata
 * @property {string} [metadata.documentNumber] - Document number
 * @property {string} [metadata.matter] - Related matter/reference
 * @property {string} [metadata.description] - Document description
 */

/**
 * Creates a new card data object with default values
 * @param {Partial<ExtendedCardData>} overrides - Values to override defaults
 * @returns {ExtendedCardData}
 */
function createCardData(overrides = {}) {
    const defaults = {
        id: CardSystem.generateCardId(),
        type: 'text',
        title: 'New Document',
        position: { x: 100, y: 100 },
        pinned: false,
        folders: [],
        documentType: 'other',
        classification: 'Internal',
        syncStatus: 'synced',
        lastModified: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        metadata: {}
    };

    return { ...defaults, ...overrides };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createCardData };
}
