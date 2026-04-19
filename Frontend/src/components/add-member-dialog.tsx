import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInviteMember, useDirectAddMember } from "@/hooks/use-churches";
import { toast } from "sonner";
import { Mail, UserPlus } from "lucide-react";

interface AddMemberDialogProps {
  churchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyInvite = { email: "", role: "MEMBER" as "ADMIN" | "MEMBER" };
const emptyDirect = {
  email: "",
  firstName: "",
  lastName: "",
  role: "MEMBER" as "ADMIN" | "MEMBER",
};

export function AddMemberDialog({
  churchId,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const [invite, setInvite] = useState(emptyInvite);
  const [direct, setDirect] = useState(emptyDirect);

  const inviteMember = useInviteMember(churchId);
  const directAddMember = useDirectAddMember(churchId);

  const reset = () => {
    setInvite(emptyInvite);
    setDirect(emptyDirect);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleInvite = async () => {
    if (!invite.email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await inviteMember.mutateAsync(invite);
      toast.success(
        "Invite sent — they'll receive an email with a link to join.",
      );
      handleClose();
    } catch {
      toast.error("Failed to send invite");
    }
  };

  const handleDirectAdd = async () => {
    if (!direct.email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await directAddMember.mutateAsync({
        email: direct.email,
        firstName: direct.firstName || undefined,
        lastName: direct.lastName || undefined,
        role: direct.role,
      });
      toast.success("Member added! Login credentials sent to their email.");
      handleClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Failed to add member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Send an invite link, or directly add them with auto-generated
            credentials.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite" className="gap-2">
              <Mail className="h-3.5 w-3.5" />
              Send Invite
            </TabsTrigger>
            <TabsTrigger value="direct" className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              Direct Add
            </TabsTrigger>
          </TabsList>

          {/* ── INVITE TAB ── */}
          <TabsContent value="invite" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="member@example.com"
                value={invite.email}
                onChange={(e) =>
                  setInvite({ ...invite, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={invite.role}
                onValueChange={(v) =>
                  setInvite({ ...invite, role: v as "ADMIN" | "MEMBER" })
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              An invite link will be emailed. They must have or create an
              account to accept.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ── DIRECT ADD TAB ── */}
          <TabsContent value="direct" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="direct-firstname">First Name</Label>
                <Input
                  id="direct-firstname"
                  placeholder="John"
                  value={direct.firstName}
                  onChange={(e) =>
                    setDirect({ ...direct, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direct-lastname">Last Name</Label>
                <Input
                  id="direct-lastname"
                  placeholder="Doe"
                  value={direct.lastName}
                  onChange={(e) =>
                    setDirect({ ...direct, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direct-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="direct-email"
                type="email"
                placeholder="member@example.com"
                value={direct.email}
                onChange={(e) =>
                  setDirect({ ...direct, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direct-role">Role</Label>
              <Select
                value={direct.role}
                onValueChange={(v) =>
                  setDirect({ ...direct, role: v as "ADMIN" | "MEMBER" })
                }
              >
                <SelectTrigger id="direct-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              If this email isn't registered, a new account will be created. A
              random password and login instructions will be emailed to them.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDirectAdd}
                disabled={directAddMember.isPending}
              >
                {directAddMember.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
