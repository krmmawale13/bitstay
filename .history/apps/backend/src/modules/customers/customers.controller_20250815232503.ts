async create(data: any) {
  return this.prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      tenant: {
        connect: { id: Number(data.tenantId) },
      },
      addresses: Array.isArray(data.addresses) && data.addresses.length
        ? {
            create: data.addresses.map((addr) => ({
              line1: addr.line1 ?? '',
              line2: addr.line2 ?? '',
              city: addr.city ?? '',
              state: addr.state ?? '',
              zip: addr.zip ?? '',
            })),
          }
        : undefined,
    },
    include: { addresses: true, tenant: true },
  });
}
