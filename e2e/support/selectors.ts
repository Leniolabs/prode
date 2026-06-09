// Shared locator helpers. All selectors use roles or visible text where
// possible. CSS-class selectors are used only where inputs have no other
// stable identifier (MatchInput goal number fields).

export const SEL = {
  // Login page
  googleSignInButton: 'button:has-text("Google")',

  // Rooms page
  createRoomButton: 'a:has-text("Crea Nuevo Prode")',
  roomRow: '[class*="roomRow"]',
  enterButton: 'button[class*="enterButton"]',
  passwordInput: 'input[placeholder*="contrase"]',
  passwordSubmitButton: 'button:has-text("Entrar")',

  // Create room page
  roomNameInput: 'input[placeholder="Nuevo Prode 1"]',
  saveButton: 'button:has-text("Guardar")',
  cancelButton: 'a:has-text("Cancelar")',

  // Groups page
  groupsSaveButton: 'button:has-text("Guardar")',
  leftGoalsInput: 'input[class*="leftGoals"]',
  rightGoalsInput: 'input[class*="rightGoals"]',

  // Ranking page
  rankingRow: '[class*="rankingRow"], table tbody tr',
  leaveRoomButton: 'button:has-text("Abandonar")',

  // Admin page
  resetMatchesButton: 'button:has-text("RESET MATCHES")',
  pruneDbButton: 'button:has-text("PRUNE DB")',
  startFinalsButton: 'button:has-text("Start Finals")',
  adminSaveButton: 'button:has-text("Guardar")',

  // Profile modal
  cogIcon: '[class*="cogIcon"], [class*="headerMenu"]',
  profileNameInput: 'input[class*="name"], [class*="profileModal"] input[type="text"]',
  profileSaveButton: 'button:has-text("Guardar")',

  // Room edit modal
  pencilButton: 'button[class*="buttonIcon"]:has([class*="pencil"]), button:has([data-icon="pencil"])',
} as const;
