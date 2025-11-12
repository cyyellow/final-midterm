import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type FriendStatus = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  isListening: boolean;
};

type RightStatusProps = {
  statuses: FriendStatus[];
};

export function RightStatus({ statuses }: RightStatusProps) {
  return (
    <aside className="flex h-full flex-col">
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Listening now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Follow friends to see what they are listening to in real time.
            </p>
          ) : (
            <ul className="space-y-3">
              {statuses.map((status) => (
                <li
                  key={status.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={status.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {status.displayName?.[0] ??
                        status.username.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">
                        {status.displayName ?? status.username}
                      </span>
                      <Badge
                        variant={status.isListening ? "success" : "secondary"}
                      >
                        {status.isListening ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    {status.trackName ? (
                      <p className="text-sm text-muted-foreground">
                        {status.trackName}
                        {status.artistName ? (
                          <span className="text-xs text-muted-foreground/80">
                            {" "}
                            • {status.artistName}
                          </span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Not listening right now
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}


