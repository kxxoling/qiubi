/**
 * Settings section: Web UI (maps to the Web UI page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Globe, KeyRound, Lock, PanelTop } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField, PathField, TextField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function WebUiSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Globe className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Web UI")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumField
            label={t("Web UI Port")}
            field="web_ui_port"
            form={form}
            update={update}
            min={1}
            max={65535}
          />
          <TextField
            label={t("IP address")}
            field="web_ui_address"
            datalist={["*", "0.0.0.0", "127.0.0.1"]}
            form={form}
            update={update}
            placeholder="*"
          />
          <TextField label={t("Username")} field="web_ui_username" form={form} update={update} />
          <TextField
            label={`${t("New Password")} (${t("Leave empty to keep")})`}
            field="web_ui_password"
            form={form}
            update={update}
            type="password"
          />
          <NumField
            label={t("Session Timeout (s)")}
            field="web_ui_session_timeout"
            form={form}
            update={update}
            help={t("help.session_timeout")}
          />
          <NumField
            label={t("Max auth failures before ban")}
            field="web_ui_max_auth_fail_count"
            form={form}
            update={update}
          />
          <NumField
            label={t("Ban Duration (s)")}
            field="web_ui_ban_duration"
            form={form}
            update={update}
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Lock className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Security")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("CSRF Protection")}
            field="web_ui_csrf_protection_enabled"
            form={form}
            update={update}
            help={t("help.csrf")}
          />
          <CheckField
            label={t("Host Header Validation")}
            field="web_ui_host_header_validation_enabled"
            form={form}
            update={update}
            help={t("help.host_validation")}
          />
          <CheckField
            label={t("Clickjacking Protection")}
            field="web_ui_clickjacking_protection_enabled"
            form={form}
            update={update}
            help={t("help.clickjacking")}
          />
          <CheckField
            label={t("Secure Cookie")}
            field="web_ui_secure_cookie_enabled"
            form={form}
            update={update}
            help={t("help.secure_cookie")}
          />
          <TextField
            label={t("Server domains")}
            field="web_ui_domain_list"
            datalist={["*", "localhost"]}
            form={form}
            update={update}
            placeholder="*"
            help={t("help.domain_list")}
          />
          <p className="text-xs text-muted-foreground">{t("Reverse proxy note")}</p>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <KeyRound className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Authentication")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Bypass authentication for clients on localhost")}
            field="bypass_local_auth"
            form={form}
            update={update}
            help={t("help.bypass_local")}
          />
          <CheckField
            label={t("Bypass authentication for clients in whitelisted IP subnets")}
            field="bypass_auth_subnet_whitelist_enabled"
            form={form}
            update={update}
            help={t("help.bypass_subnet")}
          />

          <div className="pl-6">
            <TextField
              inset
              label={t("Whitelist")}
              field="bypass_auth_subnet_whitelist"
              datalist={["127.0.0.1/8", "192.168.0.0/24", "10.0.0.0/8", "172.16.0.0/12"]}
              form={form}
              update={update}
              placeholder="192.168.1.0/24, 10.0.0.0/8"
            />
          </div>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <PanelTop className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Use alternative Web UI")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Use alternative Web UI")}
            field="alternative_webui_enabled"
            form={form}
            update={update}
          />

          <div className="pl-6">
            <PathField
              inset
              label={t("Files location")}
              field="alternative_webui_path"
              form={form}
              update={update}
            />
          </div>

          <CheckField
            label={t("Use HTTPS")}
            field="use_https"
            form={form}
            update={update}
            help={t("help.https")}
          />

          <div className="pl-6 space-y-3">
            <TextField
              inset
              label={t("Certificate")}
              field="web_ui_https_cert_path"
              form={form}
              update={update}
            />
            <TextField
              inset
              label={t("Key")}
              field="web_ui_https_key_path"
              form={form}
              update={update}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
