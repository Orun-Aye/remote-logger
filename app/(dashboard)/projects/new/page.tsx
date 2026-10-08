"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "@/hooks/project.hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [tagsInput, setTagsInput] = useState("");

  const nameError = name.length > 0 && name.trim().length < 2;
  const canSubmit = name.trim().length >= 2 && !createProject.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    const projectData: any = {
      name: name.trim(),
    };

    if (description.trim()) {
      projectData.description = description.trim();
    }

    if (environment) {
      projectData.environment = environment;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      projectData.tags = tags;
    }

    try {
      const result = await createProject.mutateAsync(projectData);
      toast.success("Project created successfully!");

      // Navigate to the new project
      // The API answers with `id` (ProjectService.createProject); keep the
      // older shapes as fallbacks
      const newProjectId = result?.id ?? result?._id ?? result?.project?._id;
      if (newProjectId) {
        router.push(`/projects/${newProjectId}`);
      } else {
        router.push("/projects");
      }
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to create project. Please try again."
      );
    }
  };

  return (
    <div className="p-6 md:px-8 lg:p-10 space-y-6 max-w-2xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Create New Project"
        description="Set up a new project to start logging and monitoring your application."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        }
      />

      {/* Form Card */}
      <Card className="bg-bg-surface border-border-subtle">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label
                htmlFor="project-name"
                className="text-sm font-body text-text-primary"
              >
                Project Name <span className="text-status-danger">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="My Application"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-base border-border-subtle"
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-status-danger">
                  Project name must be at least 2 characters.
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="project-description"
                className="text-sm font-body text-text-primary"
              >
                Description
              </Label>
              <Textarea
                id="project-description"
                placeholder="Brief description of what this project monitors..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-bg-base border-border-subtle min-h-[100px] resize-none"
              />
            </div>

            {/* Environment */}
            <div className="space-y-2">
              <Label
                htmlFor="project-environment"
                className="text-sm font-body text-text-primary"
              >
                Environment
              </Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger className="bg-bg-base border-border-subtle">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-text-muted">
                Select the environment this project will primarily monitor.
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label
                htmlFor="project-tags"
                className="text-sm font-body text-text-primary"
              >
                Tags
              </Label>
              <Input
                id="project-tags"
                placeholder="frontend, react, api (comma-separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-bg-base border-border-subtle"
              />
              <p className="text-xs text-text-muted">
                Add comma-separated tags to organize your projects.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/projects")}
                disabled={createProject.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="signal"
                disabled={!canSubmit}
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
