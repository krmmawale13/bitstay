async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: {
      tenants: {
        include: { tenant: true },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const tenantIds = user.tenants.map(t => t.tenantId);
  const roles = user.tenants.map(t => ({ tenantId: t.tenantId, role: t.role }));

  const payload = {
    sub: user.id,
    email: user.email,
    tenantIds,
    roles,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

  return {
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenants: user.tenants.map(t => ({
        id: t.tenant.id,
        code: t.tenant.code,
        name: t.tenant.name,
        role: t.role,
      })),
    },
  };
}
