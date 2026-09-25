/**
 * Settings section: Connection (maps to the Connection page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Network, Radio, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField, SelectField, TextField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function ConnectionSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Radio className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Listening Port")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumField
            label={t("Listening Port")}
            field="listen_port"
            form={form}
            update={update}
            min={1}
            max={65535}
            help={t("help.listen_port")}
          />
          <CheckField
            label={t("Use a random port on startup")}
            field="random_port"
            form={form}
            update={update}
            help={t("help.random_port")}
          />
          <CheckField
            label={t("Use UPnP / NAT-PMP port forwarding")}
            field="upnp"
            form={form}
            update={update}
            help={t("help.upnp")}
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Network className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Connections Limits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumField
            label={t("Global maximum connections")}
            field="max_connec"
            form={form}
            update={update}
            hint="-1 = ∞"
            help={t("help.max_connec")}
          />
          <NumField
            label={t("Maximum connections per torrent")}
            field="max_connec_per_torrent"
            form={form}
            update={update}
            hint="-1 = ∞"
            help={t("help.max_connec_per_torrent")}
          />
          <NumField
            label={t("Global maximum upload slots")}
            field="max_uploads"
            form={form}
            update={update}
            hint="-1 = ∞"
            help={t("help.max_uploads")}
          />
          <NumField
            label={t("Maximum upload slots per torrent")}
            field="max_uploads_per_torrent"
            form={form}
            update={update}
            hint="-1 = ∞"
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Shield className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Proxy Server")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SelectField
            label={t("Type")}
            field="proxy_type"
            form={form}
            update={update}
            help={t("help.proxy")}
            options={[
              { value: -1, label: t("(Disabled)") },
              { value: 0, label: "SOCKS5" },
              { value: 2, label: "HTTP" },
            ]}
          />
          {(form.proxy_type as number) !== -1 && (
            <>
              <TextField label={t("Host")} field="proxy_ip" form={form} update={update} />
              <NumField
                label={t("Port")}
                field="proxy_port"
                form={form}
                update={update}
                min={1}
                max={65535}
              />
              <CheckField
                label={t("Use proxy for peer connections")}
                field="proxy_peer_connections"
                form={form}
                update={update}
                help={t("help.proxy_peers")}
              />
              <CheckField
                label={t("Authentication")}
                field="proxy_auth_enabled"
                form={form}
                update={update}
              />
              {form.proxy_auth_enabled ? (
                <>
                  <TextField
                    label={t("Username")}
                    field="proxy_username"
                    form={form}
                    update={update}
                  />
                  <TextField
                    label={t("Password")}
                    field="proxy_password"
                    form={form}
                    update={update}
                    type="password"
                  />
                </>
              ) : null}
              <CheckField
                label={t("Use proxy only for torrents")}
                field="proxy_torrents_only"
                form={form}
                update={update}
                help={t("help.proxy_torrents_only")}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
