"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"
import { Key, Package, Shield, Users, Layers, Award, Webhook } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { CreateLicenseDialog } from "@/components/licenses/create-license-dialog"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { CreatePolicyDialog } from "@/components/policies/create-policy-dialog"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { CreateEntitlementDialog } from "@/components/entitlements/create-entitlement-dialog"
import { CreateWebhookDialog } from "@/components/webhooks/create-webhook-dialog"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const router = useRouter()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const quickCreateItems = [
    { key: 'license', label: 'License', icon: Key, path: '/dashboard/licenses' },
    { key: 'product', label: 'Product', icon: Package, path: '/dashboard/products' },
    { key: 'policy', label: 'Policy', icon: Shield, path: '/dashboard/policies' },
    { key: 'user', label: 'User', icon: Users, path: '/dashboard/users' },
    { key: 'group', label: 'Group', icon: Layers, path: '/dashboard/groups' },
    { key: 'entitlement', label: 'Entitlement', icon: Award, path: '/dashboard/entitlements' },
    { key: 'webhook', label: 'Webhook', icon: Webhook, path: '/dashboard/webhooks' },
  ]

  const handleCreated = (path: string) => {
    setActiveDialog(null)
    router.push(path)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled />
                  <span>Quick Create</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                {quickCreateItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => setActiveDialog(item.key)}
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Quick Create Dialogs */}
      <CreateLicenseDialog
        open={activeDialog === 'license'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onLicenseCreated={() => handleCreated('/dashboard/licenses')}
      />
      <CreateProductDialog
        open={activeDialog === 'product'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onProductCreated={() => handleCreated('/dashboard/products')}
      />
      <CreatePolicyDialog
        open={activeDialog === 'policy'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onPolicyCreated={() => handleCreated('/dashboard/policies')}
      />
      <CreateUserDialog
        open={activeDialog === 'user'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onUserCreated={() => handleCreated('/dashboard/users')}
      />
      <CreateGroupDialog
        open={activeDialog === 'group'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onGroupCreated={() => handleCreated('/dashboard/groups')}
      />
      <CreateEntitlementDialog
        open={activeDialog === 'entitlement'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onEntitlementCreated={() => handleCreated('/dashboard/entitlements')}
      />
      <CreateWebhookDialog
        open={activeDialog === 'webhook'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onWebhookCreated={() => handleCreated('/dashboard/webhooks')}
      />
    </SidebarGroup>
  )
}
