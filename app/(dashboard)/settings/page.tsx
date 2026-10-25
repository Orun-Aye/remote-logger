"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, Mail, Image } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/user.hook";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setEmail(profile.email || "");
      setAvatarUrl(profile.avatarUrl || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { firstName, lastName, avatarUrl: avatarUrl || undefined },
      {
        onSuccess: () => toast.success("Profile updated successfully"),
        onError: (err: any) =>
          toast.error(err?.message || "Failed to update profile"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse" />
        <div className="h-64 bg-bg-surface rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center">
            <User className="w-5 h-5 text-signal" />
          </div>
          Profile
        </h1>
        <p className="text-text-secondary mt-1 ml-[46px]">
          Manage your account information
        </p>
      </div>

      {/* Avatar preview */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-bg-elevated border-2 border-border-subtle flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl font-display font-bold text-signal">
                  {firstName?.[0]?.toUpperCase() || ""}
                  {lastName?.[0]?.toUpperCase() || ""}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-text-muted">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardHeader>
          <CardTitle className="font-display text-text-primary">
            Personal Information
          </CardTitle>
          <CardDescription className="text-text-muted">
            Update your name and avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-text-secondary text-sm">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-text-secondary text-sm">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </Label>
            <Input
              id="email"
              value={email}
              readOnly
              className="bg-bg-elevated/50 border-border-subtle text-text-muted cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl" className="text-text-secondary text-sm flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Avatar URL
            </Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="bg-background border-input text-text-primary placeholder:text-text-muted focus:border-gs-900 focus:ring-0"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Button
              variant="signal"
              onClick={handleSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
