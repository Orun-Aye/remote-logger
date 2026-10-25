"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import { Notification } from "@/types/notification.types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SignalDot } from "@/components/shared/SignalDot";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1 ? "s" : ""
                }`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="signal"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-bg-surface border-border-subtle">
              <CardContent className="p-6">
                <div className="h-16 bg-bg-elevated rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-bg-surface border-border-subtle">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No notifications
            </h3>
            <p className="text-text-muted">
              You&apos;re all caught up! Check back later for updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-l-status-danger";
      case "warning":
        return "border-l-status-warn";
      case "success":
        return "border-l-status-ok";
      case "info":
      default:
        return "border-l-data-info";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertOctagon className="w-5 h-5 text-status-danger" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-status-warn" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-status-ok" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-data-info" />;
    }
  };

  return (
    <Card
      className={`bg-bg-surface border-border-subtle ${
        !notification.read
          ? "border-l-2 bg-gs-50 " + getTypeColor(notification.type)
          : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon(notification.type)}
              <Badge variant="outline" className="capitalize border-border-subtle">
                {notification.type}
              </Badge>
              {!notification.read && (
                <SignalDot status="ok" size="sm" pulse />
              )}
            </div>
            <CardDescription className="text-base text-text-primary">
              {notification.message}
            </CardDescription>
          </div>
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              className="text-text-muted hover:text-text-primary"
              onClick={() => onMarkAsRead(notification._id)}
            >
              Mark as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>
          {notification.metadata && (
            <span className="text-xs">
              {notification.metadata.projectName &&
                `Project: ${notification.metadata.projectName}`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
