import React from "react";
import { ChevronRight, Layers, LayoutDashboard, Megaphone, Users, Smartphone, Bot, FileText, Settings, HeartHandshake, FolderOpen, Coins } from "lucide-react";
import { Project } from "../types";

interface CampaignBreadcrumbsProps {
  activeTab: string;
  activeProject: Project | null;
  subSection?: string;
  onOpenCampaignSwitcher: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function CampaignBreadcrumbs(_props: CampaignBreadcrumbsProps) {
  return null;
}
