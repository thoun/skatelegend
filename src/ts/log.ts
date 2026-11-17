const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
export const log = isDebug ? console.log.bind(window.console) : function () { };

