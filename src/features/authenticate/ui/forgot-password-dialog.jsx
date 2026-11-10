import { useRef, useState } from "react";
import { employerAuth } from "../api/employer-auth";
import { candidateAuth } from "../api/candidate-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";

export function ForgotPasswordDialog({ role = "candidate" }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  return (
    <Dialog onOpenChange={() => setMessage("")}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs font-bold text-auth-orange">
          Quên mật khẩu?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khôi phục mật khẩu</DialogTitle>
          <DialogDescription>Nhập email liên kết với tài khoản của bạn.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (submitting.current) return;
            submitting.current = true;
            setPending(true);
            setMessage("");
            try {
              const result = await (
                role === "employer" ? employerAuth : candidateAuth
              ).forgotPassword(email.trim());
              setMessage(result.message);
            } catch (failure) {
              setMessage(failure.message);
            } finally {
              submitting.current = false;
              setPending(false);
            }
          }}
        >
          <Label htmlFor="recovery-email">Email</Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
          />
          <Button
            type="submit"
            disabled={pending}
            className="border-0 bg-auth-orange text-white hover:bg-auth-brand-hover"
          >
            {pending ? "Đang gửi…" : "Gửi yêu cầu khôi phục"}
          </Button>
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
