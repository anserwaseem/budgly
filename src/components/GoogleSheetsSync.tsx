import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";

interface GoogleSheetsSyncProps {
  transactions: Transaction[];
}

export function GoogleSheetsSync({ transactions }: GoogleSheetsSyncProps) {
  const {
    isAuthenticated,
    isConnected,
    isOnline,
    isSyncing,
    autoSync,
    sheetId,
    lastSyncTime,
    connect,
    disconnect,
    createNewSheet,
    connectToSheet,
    syncNow,
    setAutoSync,
  } = useGoogleSheets();

  const [showInstructions, setShowInstructions] = useState(!isConnected);
  const [sheetOption, setSheetOption] = useState<"new" | "existing">("new");
  const [newSheetName, setNewSheetName] = useState("");
  const [existingSheetUrl, setExistingSheetUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch {
      // error handled by hook
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) {
      return;
    }
    setIsConnecting(true);
    try {
      await createNewSheet(newSheetName.trim());
      setNewSheetName("");
    } catch {
      // error handled by hook
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectToSheet = async () => {
    if (!existingSheetUrl.trim()) {
      return;
    }
    setIsConnecting(true);
    try {
      await connectToSheet(existingSheetUrl.trim());
      setExistingSheetUrl("");
    } catch {
      // error handled by hook
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    await syncNow(transactions);
  };

  const sheetUrl = sheetId
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    : null;

  return (
    <div className="space-y-4">
      {/* Setup Instructions */}
      <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Setup Instructions</span>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Step 1: Access Sync Settings</p>
              <p className="text-muted-foreground text-xs">
                You're already here! This is the sync settings page.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                Step 2: Connect Your Google Account
              </p>
              <p className="text-muted-foreground text-xs">
                Click "Connect Google Sheets" below. A Google sign-in popup will
                appear. Sign in and grant permissions to access Google Sheets.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                Step 3: Choose Your Sheet Option
              </p>
              <p className="text-muted-foreground text-xs mb-2">
                You have two options:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                <li>
                  <strong>Create New Sheet:</strong> Enter a name and the app
                  will create a new Google Sheet with the correct format.
                </li>
                <li>
                  <strong>Use Existing Sheet:</strong> Paste your Google Sheet
                  URL e.g.,
                  <code className="bg-background px-1 rounded break-all inline-block max-w-full">
                    https://docs.google.com/spreadsheets/d/SHEET_ID/edit
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">
                Step 4: Enable Auto-Sync (Optional)
              </p>
              <p className="text-muted-foreground text-xs">
                Toggle "Auto-Sync" ON to automatically sync transactions when
                you add, edit, or delete them (only when online).
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Step 5: Verify Connection</p>
              <p className="text-muted-foreground text-xs">
                You should see a green checkmark and connection status. Your
                Google Sheet link will be shown.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-primary" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm">{isOnline ? "Online" : "Offline"}</span>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not Connected</span>
          </div>
        )}
      </div>

      {/* Authentication */}
      {!isAuthenticated && (
        <div className="space-y-3">
          <button
            onClick={handleConnect}
            disabled={!isOnline || isConnecting}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-opacity",
              isOnline && !isConnecting
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google Sheets"
            )}
          </button>
          {!isOnline && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Device is offline. Please connect to the internet to set up sync.
            </p>
          )}
        </div>
      )}

      {/* Sheet Setup */}
      {isAuthenticated && !isConnected && (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setSheetOption("new")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                sheetOption === "new"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create New Sheet
            </button>
            <button
              onClick={() => setSheetOption("existing")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                sheetOption === "existing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Use Existing Sheet
            </button>
          </div>

          {sheetOption === "new" && (
            <div className="space-y-2">
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Enter sheet name (e.g., Bujit Transactions 2024)"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                disabled={!isOnline || isConnecting}
              />
              <button
                onClick={handleCreateSheet}
                disabled={!newSheetName.trim() || !isOnline || isConnecting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-opacity",
                  newSheetName.trim() && isOnline && !isConnecting
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Connect"
                )}
              </button>
            </div>
          )}

          {sheetOption === "existing" && (
            <div className="space-y-2">
              <input
                type="text"
                value={existingSheetUrl}
                onChange={(e) => setExistingSheetUrl(e.target.value)}
                placeholder="Paste Google Sheet URL"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                disabled={!isOnline || isConnecting}
              />
              <p className="text-xs text-muted-foreground">
                Example:
                <code className="bg-background px-1 rounded break-all inline-block max-w-full">
                  https://docs.google.com/spreadsheets/d/SHEET_ID/edit
                </code>
              </p>
              <button
                onClick={handleConnectToSheet}
                disabled={!existingSheetUrl.trim() || !isOnline || isConnecting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-opacity",
                  existingSheetUrl.trim() && isOnline && !isConnecting
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connected State */}
      {isConnected && (
        <div className="space-y-4">
          {/* Sheet Info */}
          {sheetUrl && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Connected Sheet</span>
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open Sheet
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {sheetUrl}
              </p>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="text-xs text-muted-foreground">
              Last synced: {format(new Date(lastSyncTime), "PPp")}
            </div>
          )}

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Auto-Sync</p>
              <p className="text-xs text-muted-foreground">
                Automatically sync transactions when online
              </p>
            </div>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                autoSync ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform",
                  autoSync ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Manual Sync Button */}
          <button
            onClick={handleSyncNow}
            disabled={!isOnline || isSyncing || transactions.length === 0}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-opacity",
              isOnline && !isSyncing && transactions.length > 0
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </button>
          {!isOnline && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Device is offline. Sync will resume when online.
            </p>
          )}

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="w-full py-2.5 rounded-lg font-medium bg-muted text-muted-foreground 
                       hover:bg-muted/80 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Troubleshooting */}
      <Collapsible>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Troubleshooting</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Connection Issues</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                <li>
                  Make sure you're signed in to the correct Google account
                </li>
                <li>Check that you granted all required permissions</li>
                <li>Try disconnecting and reconnecting</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Sync Not Working</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                <li>
                  Check your internet connection (sync only works when online)
                </li>
                <li>
                  Verify the sheet URL is correct (if using existing sheet)
                </li>
                <li>Make sure you have edit access to the sheet</li>
                <li>Try manual sync first to test the connection</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Sheet Format</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
                <li>
                  The app automatically creates the correct column headers
                </li>
                <li>Date format: DD/MM/YYYY</li>
                <li>
                  Columns: Date, Reason, Amount, Payment Mode, Type, Necessity
                </li>
                <li>Existing data in the sheet will be replaced on sync</li>
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
