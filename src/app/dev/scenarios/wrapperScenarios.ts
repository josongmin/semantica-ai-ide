/**
 * Wrapper scenarios that expose simulate* functions as async scenario* methods
 * so they can be used from DevScenarioBar and match the DevSimulator interface.
 */
import { simulateCodingOS } from "./codingOsSimulations";
import {
  simulateAgents,
  simulateArena,
  simulateBrowser,
  simulateGitCommits,
  simulateIndex,
  simulateMcp,
  simulateMemory,
  simulateRemote,
  simulateReview,
} from "./simpleSimulations";
import { streamTurn } from "./streamingScenarios";

export async function simScenarioCodingOS() {
  await simulateCodingOS();
}

export function simScenarioAgents() {
  simulateAgents();
}

export function simScenarioMcp() {
  simulateMcp();
}

export function simScenarioBrowser() {
  simulateBrowser();
}

export function simScenarioMemory() {
  simulateMemory();
}

export async function simScenarioArena() {
  await simulateArena();
}

export function simScenarioGitCommits() {
  simulateGitCommits();
}

export function simScenarioRemote() {
  simulateRemote();
}

export function simScenarioIndex() {
  simulateIndex();
}

export async function simScenarioChatStream() {
  await streamTurn(3);
}

export function simScenarioReviewComments() {
  simulateReview();
}
