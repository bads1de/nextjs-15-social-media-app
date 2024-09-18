import {
  ChannelList,
  ChannelPreviewMessenger,
  ChannelPreviewProps,
} from "stream-chat-react";
import { useSession } from "../SessionProvider";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const { user } = useSession();

  const channelPreviewCustom = useCallback(
    (props: ChannelPreviewProps) => (
      <ChannelPreviewMessenger
        {...props}
        onSelect={() => {
          props.setActiveChannel?.(props.channel, props.watchers);
          onClose();
        }}
      />
    ),
    [onClose],
  );

  return (
    <div
      className={cn(
        "size-full flex-col border-e md:flex md:w-72",
        open ? "flex" : "hidden",
      )}
    >
      <MenuHeader onClose={onClose} />
      <ChannelList
        filters={{ type: "messaging", members: { $in: [user.id] } }}
        showChannelSearch
        options={{ state: true, presence: true, limit: 8 }}
        sort={{ last_message_at: -1 }}
        additionalChannelSearchProps={{
          searchForChannels: true,
          searchQueryParams: {
            channelFilters: {
              filters: { members: { $in: [user.id] } },
            },
          },
        }}
        Preview={channelPreviewCustom}
      />
    </div>
  );
}

interface MenuHeaderProps {
  onClose: () => void;
}

function MenuHeader({ onClose }: MenuHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="h-full md:hidden">
        <Button size={"icon"} variant={"ghost"} onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>
    </div>
  );
}
