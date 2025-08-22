// apps/backend/src/modules/settings/access.controller.ts
@Put('users/:userId/overrides')
async setOverrides(@Req() req, @Param('userId') userId: string, @Body() dto: OverrideDto) {
  const tenantId = Number(req.tenant?.id ?? req.tenantId);
  const key = this.key(tenantId, Number(userId));

  // normalize + stringify (because your `value` column is String)
  const add = Array.isArray(dto?.add) ? dto.add : [];
  const remove = Array.isArray(dto?.remove) ? dto.remove : [];
  const valueString = JSON.stringify({ add, remove });

  // Find existing record (no unique on key in your schema)
  const existing = await (this.prisma as any).metadata.findFirst({
    where: { key },
    select: { id: true },
  });

  if (existing?.id) {
    // UPDATE path
    await (this.prisma as any).metadata.update({
      where: { id: existing.id },
      data: { value: valueString, type: 'acl' },
    });
  } else {
    // CREATE path – try simple create first
    try {
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',         // NOTE: literal string, NOT JS `String`
          value: valueString,  // NOTE: String column, not JSON
          // tenantId,         // uncomment if Metadata.tenantId is required
        },
      });
    } catch (err: any) {
      // If creation demands required relation `version`, do a two-step create
      const needVersion =
        /Argument `version` is missing/i.test(String(err?.message)) ||
        /Missing required value: version/i.test(String(err?.message));

      if (!needVersion) throw err;

      // 1) Create a minimal MetadataVersion row (adjust fields if your schema requires more)
      const hasMetadataVersion =
        (this.prisma as any).metadataVersion?.create &&
        typeof (this.prisma as any).metadataVersion.create === 'function';

      if (!hasMetadataVersion) {
        // Safety: schema truly requires version but model missing — surface clear error
        throw new Error('Metadata.version is required by schema, but MetadataVersion model not available.');
      }

      const versionRow = await (this.prisma as any).metadataVersion.create({
        data: {
          // Put minimal allowed fields here. Many schemas only need autoinc id.
          // If your MetadataVersion has a JSON/string payload, you can also store the same override there:
          // data: valueString,
        },
        select: { id: true },
      });

      // 2) Now create Metadata connected to that version
      await (this.prisma as any).metadata.create({
        data: {
          key,
          type: 'acl',
          value: valueString,
          version: { connect: { id: versionRow.id } },
          // tenantId, // if required
        },
      });
    }
  }

  const permissions = await this.perms.resolveForUser(Number(userId), tenantId);
  return { ok: true, permissions };
}
