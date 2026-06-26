"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearAccountFromLocalStorage,
  fetchCurrentAccount,
  flushAccountWorkspaceSync,
  loadAccountFromLocalStorage,
  PROOFOLIO_ACCOUNT_UPDATED_EVENT,
  rememberAccountWorkspaceSnapshot,
  type ProofolioAccountState,
  scheduleAccountWorkspaceSync,
  saveAccountToLocalStorage,
} from "../lib/auth/client-account";
import {
  loadFromLocalStorage,
  PROOFOLIO_WORKSPACE_UPDATED_EVENT,
  saveToLocalStorage,
} from "../lib/storage";
import { sampleProofolioWorkspace } from "../mock/proofolio-sample";
import type { ProofolioWorkspace } from "../types/proofolio";

type WorkspaceUpdater =
  | ProofolioWorkspace
  | ((current: ProofolioWorkspace) => ProofolioWorkspace);

export function useProofolioWorkspace(
  initialWorkspace: ProofolioWorkspace = sampleProofolioWorkspace,
) {
  const [workspace, setWorkspaceState] =
    useState<ProofolioWorkspace>(initialWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [account, setAccount] = useState<ProofolioAccountState>({
    status: "checking",
  });

  useEffect(() => {
    queueMicrotask(() => {
      const storedWorkspace = loadFromLocalStorage(initialWorkspace);
      setWorkspaceState(storedWorkspace);
      saveToLocalStorage(storedWorkspace);
      setHydrated(true);

      const cachedAccount = loadAccountFromLocalStorage();
      setAccount(
        cachedAccount
          ? { status: "checking", user: cachedAccount }
          : { status: "checking" },
      );

      fetchCurrentAccount()
        .then((session) => {
          if (!session) {
            clearAccountFromLocalStorage();
            setAccount({ status: "guest" });
            return;
          }

          saveAccountToLocalStorage(session.user);
          setWorkspaceState(session.workspace);
          saveToLocalStorage(session.workspace);
          setAccount({
            status: "authenticated",
            user: session.user,
          });
        })
        .catch(() => {
          setAccount(
            cachedAccount
              ? { status: "checking", user: cachedAccount }
              : { status: "guest" },
          );
        });
    });
  }, [initialWorkspace]);

  useEffect(() => {
    const handleWorkspaceUpdate = (event: Event) => {
      const updatedWorkspace = (
        event as CustomEvent<ProofolioWorkspace>
      ).detail;

      if (updatedWorkspace) {
        setWorkspaceState(updatedWorkspace);
      }
    };

    window.addEventListener(
      PROOFOLIO_WORKSPACE_UPDATED_EVENT,
      handleWorkspaceUpdate,
    );

    return () => {
      window.removeEventListener(
        PROOFOLIO_WORKSPACE_UPDATED_EVENT,
        handleWorkspaceUpdate,
      );
    };
  }, []);

  useEffect(() => {
    const handleAccountUpdate = (event: Event) => {
      const updatedAccount = (
        event as CustomEvent<ProofolioAccountState["user"]>
      ).detail;

      setAccount(
        updatedAccount
          ? { status: "authenticated", user: updatedAccount }
          : { status: "guest" },
      );
    };

    window.addEventListener(
      PROOFOLIO_ACCOUNT_UPDATED_EVENT,
      handleAccountUpdate,
    );

    return () => {
      window.removeEventListener(
        PROOFOLIO_ACCOUNT_UPDATED_EVENT,
        handleAccountUpdate,
      );
    };
  }, []);

  useEffect(() => {
    rememberAccountWorkspaceSnapshot(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!hydrated || account.status !== "authenticated") return;

    const flushWorkspace = () => {
      flushAccountWorkspaceSync();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushWorkspace();
      }
    };

    window.addEventListener("pagehide", flushWorkspace);
    window.addEventListener("beforeunload", flushWorkspace);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushWorkspace);
      window.removeEventListener("beforeunload", flushWorkspace);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [account.status, hydrated]);

  const setWorkspace = useCallback((updater: WorkspaceUpdater) => {
    setWorkspaceState((current) => {
      const next =
        typeof updater === "function" ? updater(current) : updater;
      const timestampedWorkspace = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      saveToLocalStorage(timestampedWorkspace);
      rememberAccountWorkspaceSnapshot(timestampedWorkspace);
      if (account.status === "authenticated") {
        scheduleAccountWorkspaceSync(timestampedWorkspace);
      }
      return timestampedWorkspace;
    });
  }, [account.status]);

  const resetWorkspace = useCallback(() => {
    const resetValue = {
      ...initialWorkspace,
      userProfile: {
        ...initialWorkspace.userProfile,
        targetIndustries: [...initialWorkspace.userProfile.targetIndustries],
        coreStrengths: [...initialWorkspace.userProfile.coreStrengths],
        workValues: [...initialWorkspace.userProfile.workValues],
      },
      uploadedFiles: [...initialWorkspace.uploadedFiles],
      analyses: [...initialWorkspace.analyses],
      portfolioOutputs: { ...initialWorkspace.portfolioOutputs },
      coverLetterOutputs: { ...initialWorkspace.coverLetterOutputs },
      resumeBullets: { ...initialWorkspace.resumeBullets },
      feedbackScores: { ...initialWorkspace.feedbackScores },
      interviewQuestions: { ...initialWorkspace.interviewQuestions },
      questionAnswers: { ...initialWorkspace.questionAnswers },
      careerInputs: initialWorkspace.careerInputs.map((input) => ({
        ...input,
        tags: [...input.tags],
      })),
      personalBrand: initialWorkspace.personalBrand
        ? {
            ...initialWorkspace.personalBrand,
            strengths: initialWorkspace.personalBrand.strengths.map(
              (strength) => ({
                ...strength,
                evidenceProjects: [...strength.evidenceProjects],
              }),
            ),
            keywords: [...initialWorkspace.personalBrand.keywords],
            targetRoles: [...initialWorkspace.personalBrand.targetRoles],
            sourceAnalysisIds: [
              ...initialWorkspace.personalBrand.sourceAnalysisIds,
            ],
          }
        : undefined,
      skillAnalysis: initialWorkspace.skillAnalysis
        ? {
            ...initialWorkspace.skillAnalysis,
            skills: initialWorkspace.skillAnalysis.skills.map((skill) => ({
              ...skill,
              evidence: [...skill.evidence],
            })),
            categories: initialWorkspace.skillAnalysis.categories.map(
              (category) => ({ ...category }),
            ),
            topStrengths: [...initialWorkspace.skillAnalysis.topStrengths],
            developmentPriorities: [
              ...initialWorkspace.skillAnalysis.developmentPriorities,
            ],
            sourceAnalysisIds: [
              ...initialWorkspace.skillAnalysis.sourceAnalysisIds,
            ],
          }
        : undefined,
      updatedAt: new Date().toISOString(),
    };

    saveToLocalStorage(resetValue);
    rememberAccountWorkspaceSnapshot(resetValue);
    if (account.status === "authenticated") {
      scheduleAccountWorkspaceSync(resetValue);
    }
    setWorkspaceState(resetValue);
  }, [account.status, initialWorkspace]);

  return {
    account,
    workspace,
    hydrated,
    setWorkspace,
    resetWorkspace,
  };
}
