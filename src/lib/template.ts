/** Values substitutable into config.yaml copy templates. */
export type TemplateVars = Record<string, string | number>;

/**
 * Replace `{placeholder}` tokens in a config string.
 * Unknown tokens are left verbatim so a typo in config.yaml is visible in the
 * UI rather than silently rendering as an empty gap.
 */
export function fill(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
