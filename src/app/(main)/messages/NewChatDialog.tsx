import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";
import { useState } from "react";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();

  const { toast } = useToast();

  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="p-6 pt-6">
          <DialogTitle>新しいチャット</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
