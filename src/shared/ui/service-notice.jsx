import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";

export function ServiceNotice({ title, children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Tính năng này sẽ được cung cấp khi hệ thống được kết nối dịch vụ. Hiện tại bạn đang xem
            bản giao diện mẫu.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
