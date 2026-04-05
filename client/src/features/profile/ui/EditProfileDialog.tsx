"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import type { UserProfile } from "@/features/profile/types/profile.types";
import { useProvinces } from "@/features/profile/hooks/useProvinces";

interface EditProfileDialogProps {
  profile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa trang cá nhân</DialogTitle>
        </DialogHeader>
        {open && (
          <EditProfileForm profile={profile} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditProfileForm({
  profile,
  onOpenChange,
}: {
  profile: UserProfile;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullname, setFullname] = useState(profile.fullName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [birthday, setBirthday] = useState(
    profile.birthday ? profile.birthday.slice(0, 10) : "",
  );
  const [address, setAddress] = useState(profile.address ?? "");

  const { data: provinces = [], isLoading: isLoadingProvinces } =
    useProvinces();

  const mutation = useUpdateProfile(profile.username);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Record<string, string> = {};
    if (fullname.trim() !== (profile.fullName ?? ""))
      data.fullname = fullname.trim();
    if (bio.trim() !== (profile.bio ?? "")) data.bio = bio.trim();
    if (gender && gender !== (profile.gender ?? "")) data.gender = gender;
    if (birthday !== (profile.birthday?.slice(0, 10) ?? ""))
      data.birthday = birthday;
    if (address.trim() !== (profile.address ?? ""))
      data.address = address.trim();

    if (Object.keys(data).length === 0) {
      onOpenChange(false);
      return;
    }

    mutation.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullname">Họ tên</Label>
        <Input
          id="fullname"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          maxLength={40}
          placeholder="Nhập họ tên"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Tiểu sử</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={150}
          placeholder="Mô tả về bạn"
          className="resize-none"
          rows={3}
        />
        <p className="text-right text-xs text-gray-400">{bio.length}/150</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Giới tính</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value="MALE" className="cursor-pointer">
                Nam
              </SelectItem>
              <SelectItem value="FEMALE" className="cursor-pointer">
                Nữ
              </SelectItem>
              <SelectItem value="OTHER" className="cursor-pointer">
                Khác
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday">Ngày sinh</Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tỉnh / Thành phố</Label>
        <Select value={address} onValueChange={setAddress}>
          <SelectTrigger className="cursor-pointer">
            <SelectValue placeholder="Chọn tỉnh/thành" />
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="max-h-60">
            {isLoadingProvinces ? (
              <SelectItem value="loading" disabled>
                Đang tải...
              </SelectItem>
            ) : (
              provinces.map((p) => (
                <SelectItem key={p} value={p} className="cursor-pointer">
                  {p}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="bg-blue-primary hover:bg-blue-secondary text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
