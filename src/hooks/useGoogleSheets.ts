import { useState, useEffect, useCallback } from "react";
import {
  authenticateGoogle,
  createSheet,
  verifySheetAccess,
  syncTransactionsToSheet,
  extractSheetId,
  validateSheetUrl,
  disconnectGoogleSheets,
} from "@/lib/googleSheets";
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  type GoogleSheetsConfig,
} from "@/lib/storage";
import { isOnline, onConnectivityChange } from "@/lib/connectivity";
import { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export interface UseGoogleSheetsReturn {
  isAuthenticated: boolean;
  isConnected: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  autoSync: boolean;
  sheetId: string | null;
  lastSyncTime: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  createNewSheet: (name: string) => Promise<void>;
  connectToSheet: (url: string) => Promise<void>;
  syncNow: (transactions: Transaction[]) => Promise<void>;
  setAutoSync: (enabled: boolean) => void;
}

export function useGoogleSheets(): UseGoogleSheetsReturn {
  const { toast } = useToast();
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(
    getGoogleSheetsConfig
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(isOnline());

  // listen to connectivity changes
  useEffect(() => {
    const unsubscribe = onConnectivityChange(() => {
      setOnlineStatus(isOnline());
    });
    return unsubscribe;
  }, []);

  const updateConfig = useCallback((newConfig: GoogleSheetsConfig | null) => {
    setConfig(newConfig);
    saveGoogleSheetsConfig(newConfig);
  }, []);

  const connect = useCallback(async () => {
    if (!onlineStatus) {
      toast({
        title: "Offline",
        description: "Cannot connect while offline.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { accessToken, refreshToken } = await authenticateGoogle();
      const currentConfig = getGoogleSheetsConfig();
      updateConfig({
        accessToken,
        refreshToken,
        sheetId: currentConfig?.sheetId || "",
        autoSync: currentConfig?.autoSync ?? false,
        lastSyncTimestamp: currentConfig?.lastSyncTimestamp,
      });
      toast({
        title: "Connected",
        description: "Google account connected successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect";
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
        duration: 10000, // show longer for helpful error messages
      });
      throw error;
    }
  }, [onlineStatus, toast, updateConfig]);

  const disconnect = useCallback(() => {
    disconnectGoogleSheets();
    updateConfig(null);
    toast({
      title: "Disconnected",
      description: "Google Sheets sync has been disconnected.",
    });
  }, [toast, updateConfig]);

  const createNewSheet = useCallback(
    async (name: string) => {
      if (!onlineStatus) {
        toast({
          title: "Offline",
          description: "Cannot create sheet while offline.",
          variant: "destructive",
        });
        return;
      }

      if (!config?.accessToken) {
        await connect();
      }

      try {
        const sheetId = await createSheet(name);
        const currentConfig = getGoogleSheetsConfig();
        updateConfig({
          accessToken: currentConfig?.accessToken || "",
          refreshToken: currentConfig?.refreshToken,
          sheetId,
          autoSync: currentConfig?.autoSync ?? false,
          lastSyncTimestamp: currentConfig?.lastSyncTimestamp,
        });
        toast({
          title: "Sheet Created",
          description: `"${name}" has been created and connected.`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create sheet";
        toast({
          title: "Creation Failed",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [onlineStatus, config, connect, toast, updateConfig]
  );

  const connectToSheet = useCallback(
    async (url: string) => {
      if (!onlineStatus) {
        toast({
          title: "Offline",
          description: "Cannot connect to sheet while offline.",
          variant: "destructive",
        });
        return;
      }

      if (!validateSheetUrl(url)) {
        toast({
          title: "Invalid URL",
          description:
            "Please provide a valid Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/SHEET_ID/edit)",
          variant: "destructive",
        });
        return;
      }

      const sheetId = extractSheetId(url);
      if (!sheetId) {
        toast({
          title: "Invalid URL",
          description: "Could not extract sheet ID from URL.",
          variant: "destructive",
        });
        return;
      }

      if (!config?.accessToken) {
        await connect();
      }

      try {
        const hasAccess = await verifySheetAccess(sheetId);
        if (!hasAccess) {
          toast({
            title: "Access Denied",
            description:
              "Cannot access this sheet. Make sure you have edit permissions.",
            variant: "destructive",
          });
          return;
        }

        const currentConfig = getGoogleSheetsConfig();
        updateConfig({
          accessToken: currentConfig?.accessToken || "",
          refreshToken: currentConfig?.refreshToken,
          sheetId,
          autoSync: currentConfig?.autoSync ?? false,
          lastSyncTimestamp: currentConfig?.lastSyncTimestamp,
        });
        toast({
          title: "Connected",
          description: "Successfully connected to Google Sheet.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to connect";
        toast({
          title: "Connection Failed",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [onlineStatus, config, connect, toast, updateConfig]
  );

  const syncNow = useCallback(
    async (transactions: Transaction[]) => {
      if (!onlineStatus) {
        // silent failure when offline
        return;
      }

      if (!config?.sheetId) {
        toast({
          title: "No Sheet Configured",
          description: "Please set up a Google Sheet first.",
          variant: "destructive",
        });
        return;
      }

      setIsSyncing(true);
      try {
        await syncTransactionsToSheet(transactions);
        const currentConfig = getGoogleSheetsConfig();
        updateConfig({
          ...currentConfig!,
          lastSyncTimestamp: Date.now(),
        });
        toast({
          title: "Synced",
          description: `${transactions.length} transactions synced successfully.`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to sync";
        toast({
          title: "Sync Failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [onlineStatus, config, toast, updateConfig]
  );

  const setAutoSync = useCallback(
    (enabled: boolean) => {
      const currentConfig = getGoogleSheetsConfig();
      if (currentConfig) {
        updateConfig({
          ...currentConfig,
          autoSync: enabled,
        });
      }
    },
    [updateConfig]
  );

  return {
    isAuthenticated: !!config?.accessToken,
    isConnected: !!config?.sheetId,
    isOnline: onlineStatus,
    isSyncing,
    autoSync: config?.autoSync ?? false,
    sheetId: config?.sheetId || null,
    lastSyncTime: config?.lastSyncTimestamp || null,
    connect,
    disconnect,
    createNewSheet,
    connectToSheet,
    syncNow,
    setAutoSync,
  };
}
