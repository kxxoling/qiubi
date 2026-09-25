/**
 * Settings section: Advanced (maps to the Advanced page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Mail, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField, TextField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function AdvancedSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Wrench className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("libtorrent Section")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TextField
            label={t("IP address reported to trackers")}
            field="announce_ip"
            form={form}
            update={update}
            help={t("help.announce_ip")}
          />
          <NumField
            label={t("Async I/O threads")}
            field="async_io_threads"
            form={form}
            update={update}
            help={t("help.async_io")}
          />
          <NumField
            label={t("Hashing threads")}
            field="hashing_threads"
            form={form}
            update={update}
          />
          <NumField
            label={t("File pool size")}
            field="file_pool_size"
            form={form}
            update={update}
            help={t("help.file_pool")}
          />
          <NumField
            label={t("Outstanding memory when checking torrents")}
            field="checking_memory_use"
            form={form}
            update={update}
            hint="MiB"
          />
          <NumField
            label={t("Socket backlog size")}
            field="socket_backlog_size"
            form={form}
            update={update}
          />
          <TextField
            label={t("Network interface")}
            field="current_network_interface"
            form={form}
            update={update}
            help={t("help.network_interface")}
          />
          <CheckField
            label={t("Resolve peer countries")}
            field="resolve_peer_countries"
            form={form}
            update={update}
            help={t("help.resolve_countries")}
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Mail className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Email notification upon download completion")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Enabled")}
            field="mail_notification_enabled"
            form={form}
            update={update}
          />

          <div className="pl-6 space-y-3">
            <TextField
              inset
              label={t("From")}
              field="mail_notification_sender"
              form={form}
              update={update}
            />
            <TextField
              inset
              label={t("To")}
              field="mail_notification_email"
              form={form}
              update={update}
            />
            <TextField
              inset
              label={t("SMTP server")}
              field="mail_notification_smtp"
              form={form}
              update={update}
            />
            <CheckField
              label={t("This server requires a secure connection (SSL)")}
              field="mail_notification_ssl_enabled"
              form={form}
              update={update}
            />
            <CheckField
              label={t("Authentication")}
              field="mail_notification_auth_enabled"
              form={form}
              update={update}
            />

            <TextField
              inset
              label={t("Username")}
              field="mail_notification_username"
              form={form}
              update={update}
            />
            <TextField
              inset
              label={t("Password")}
              field="mail_notification_password"
              form={form}
              update={update}
              type="password"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
