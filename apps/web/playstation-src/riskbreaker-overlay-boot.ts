/**
 * Early IIFE entry: PlayStation.htm loads this before PlayStation.js (disc pick) so spike UI works immediately.
 */
import { installRiskbreakerOverlay } from "./riskbreaker-overlay.js";

installRiskbreakerOverlay();
