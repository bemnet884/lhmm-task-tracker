"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="text-sm text-muted-foreground">
        ✓ You're using the installed app.
      </p>
    );
  }

  if (event) {
    return (
      <Button
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          setEvent(null);
        }}
      >
        <Download className="mr-2 h-4 w-4" />
        Install app
      </Button>
    );
  }

  if (ios) {
    return (
      <p className="text-sm text-muted-foreground">
        In Safari, tap the <strong>Share</strong> button, then{" "}
        <strong>Add to Home Screen</strong>.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Open your browser menu and choose <strong>Install app</strong> (or{" "}
      <strong>Add to Home screen</strong>).
    </p>
  );
}