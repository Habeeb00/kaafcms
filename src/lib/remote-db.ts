type QueryParam = string | number | null;

export type BlogRecord = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  imageUrl: string | null;
  author: string | null;
  authorImageUrl: string | null;
  readTime: string | null;
  likes: number;
  createdAt: number;
};

export type CareerRecord = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  status: string;
  location: string | null;
  type: string | null;
  workMode: string | null;
  link: string | null;
  createdAt: number;
};

export type GalleryRecord = {
  id: string;
  title: string;
  imageUrl: string;
  category: string | null;
  createdAt: number;
};

export type DashboardStats = {
  blogs: number;
  careers: number;
  gallery: number;
  openCareers: number;
};

type D1Binding = {
  prepare: (sql: string) => {
    bind: (...params: QueryParam[]) => {
      all: () => Promise<{ results?: unknown[] }>;
      run: () => Promise<unknown>;
    };
  };
};

function getD1Binding(): D1Binding | null {
  const maybeBinding = (process.env as { DB?: unknown }).DB;
  if (
    maybeBinding &&
    typeof maybeBinding === 'object' &&
    'prepare' in maybeBinding &&
    typeof (maybeBinding as D1Binding).prepare === 'function'
  ) {
    return maybeBinding as D1Binding;
  }

  return null;
}

function getD1HttpConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  if (!accountId || !databaseId || !token) {
    return null;
  }

  return { accountId, databaseId, token };
}

function offlineError() {
  return new Error(
    'Database offline or unavailable. Connect to Cloudflare D1 to use the CMS.'
  );
}

export function isDatabaseOfflineError(error: unknown) {
  return error instanceof Error && error.message.includes('Database offline');
}

async function queryRows<T>(sql: string, params: QueryParam[] = []): Promise<T[]> {
  const binding = getD1Binding();
  if (binding) {
    const result = await binding.prepare(sql).bind(...params).all();
    return (result.results ?? []) as T[];
  }

  const config = getD1HttpConfig();
  if (!config) {
    throw offlineError();
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw offlineError();
  }

  const payload = (await response.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: Array<{ results?: T[] }>;
  };

  if (!payload.success) {
    throw new Error(payload.errors?.[0]?.message || 'Database query failed.');
  }

  return payload.result?.[0]?.results ?? [];
}

async function execute(sql: string, params: QueryParam[] = []) {
  const binding = getD1Binding();
  if (binding) {
    await binding.prepare(sql).bind(...params).run();
    return;
  }

  await queryRows(sql, params);
}

function nowTs() {
  return Date.now();
}

export async function pingDatabase() {
  await queryRows('select 1 as ok');
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [blogs, careers, openCareers, gallery] = await Promise.all([
    queryRows<{ count: number }>('select count(*) as count from blogs'),
    queryRows<{ count: number }>('select count(*) as count from careers'),
    queryRows<{ count: number }>(
      "select count(*) as count from careers where status = 'open'"
    ),
    queryRows<{ count: number }>('select count(*) as count from galleries'),
  ]);

  return {
    blogs: Number(blogs[0]?.count ?? 0),
    careers: Number(careers[0]?.count ?? 0),
    openCareers: Number(openCareers[0]?.count ?? 0),
    gallery: Number(gallery[0]?.count ?? 0),
  };
}

export async function listBlogs() {
  return queryRows<BlogRecord>(
    `select
      id,
      title,
      slug,
      content,
      category,
      image_url as imageUrl,
      author,
      author_image_url as authorImageUrl,
      read_time as readTime,
      likes,
      created_at as createdAt
    from blogs
    order by created_at desc`
  );
}

export async function getBlogById(id: string) {
  const rows = await queryRows<BlogRecord>(
    `select
      id,
      title,
      slug,
      content,
      category,
      image_url as imageUrl,
      author,
      author_image_url as authorImageUrl,
      read_time as readTime,
      likes,
      created_at as createdAt
    from blogs
    where id = ?
    limit 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function createBlog(input: Omit<BlogRecord, 'likes' | 'createdAt'>) {
  const blog: BlogRecord = {
    ...input,
    likes: 0,
    createdAt: nowTs(),
  };

  await execute(
    `insert into blogs (
      id, title, slug, content, category, image_url, author, author_image_url, read_time, likes, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      blog.id,
      blog.title,
      blog.slug,
      blog.content,
      blog.category,
      blog.imageUrl,
      blog.author,
      blog.authorImageUrl,
      blog.readTime,
      blog.likes,
      blog.createdAt,
    ]
  );

  return blog;
}

export async function updateBlog(
  id: string,
  input: Pick<
    BlogRecord,
    'title' | 'slug' | 'content' | 'category' | 'imageUrl' | 'author' | 'authorImageUrl' | 'readTime' | 'likes'
  >
) {
  await execute(
    `update blogs
     set title = ?, slug = ?, content = ?, category = ?, image_url = ?, author = ?, author_image_url = ?, read_time = ?, likes = ?
     where id = ?`,
    [
      input.title,
      input.slug,
      input.content,
      input.category,
      input.imageUrl,
      input.author,
      input.authorImageUrl,
      input.readTime,
      input.likes,
      id,
    ]
  );
}

export async function deleteBlog(id: string) {
  await execute('delete from blogs where id = ?', [id]);
}

export async function incrementBlogLikes(id: string) {
  await execute('update blogs set likes = likes + 1 where id = ?', [id]);
  return getBlogById(id);
}

export async function listCareers() {
  return queryRows<CareerRecord>(
    `select
      id,
      title,
      description,
      requirements,
      status,
      location,
      type,
      work_mode as workMode,
      link,
      created_at as createdAt
    from careers
    order by created_at desc`
  );
}

export async function getCareerById(id: string) {
  const rows = await queryRows<CareerRecord>(
    `select
      id,
      title,
      description,
      requirements,
      status,
      location,
      type,
      work_mode as workMode,
      link,
      created_at as createdAt
    from careers
    where id = ?
    limit 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function createCareer(input: Omit<CareerRecord, 'createdAt'>) {
  const career: CareerRecord = {
    ...input,
    createdAt: nowTs(),
  };

  await execute(
    `insert into careers (
      id, title, description, requirements, status, location, type, work_mode, link, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      career.id,
      career.title,
      career.description,
      career.requirements,
      career.status,
      career.location,
      career.type,
      career.workMode,
      career.link,
      career.createdAt,
    ]
  );

  return career;
}

export async function updateCareer(
  id: string,
  input: Pick<
    CareerRecord,
    'title' | 'description' | 'requirements' | 'status' | 'location' | 'type' | 'workMode' | 'link'
  >
) {
  await execute(
    `update careers
     set title = ?, description = ?, requirements = ?, status = ?, location = ?, type = ?, work_mode = ?, link = ?
     where id = ?`,
    [
      input.title,
      input.description,
      input.requirements,
      input.status,
      input.location,
      input.type,
      input.workMode,
      input.link,
      id,
    ]
  );
}

export async function deleteCareer(id: string) {
  await execute('delete from careers where id = ?', [id]);
}

export async function listGalleries() {
  return queryRows<GalleryRecord>(
    `select
      id,
      title,
      image_url as imageUrl,
      category,
      created_at as createdAt
    from galleries
    order by created_at desc`
  );
}

export async function getGalleryById(id: string) {
  const rows = await queryRows<GalleryRecord>(
    `select
      id,
      title,
      image_url as imageUrl,
      category,
      created_at as createdAt
    from galleries
    where id = ?
    limit 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function createGallery(input: Omit<GalleryRecord, 'createdAt'>) {
  const item: GalleryRecord = {
    ...input,
    createdAt: nowTs(),
  };

  await execute(
    `insert into galleries (
      id, title, image_url, category, created_at
    ) values (?, ?, ?, ?, ?)`,
    [item.id, item.title, item.imageUrl, item.category, item.createdAt]
  );

  return item;
}

export async function updateGallery(
  id: string,
  input: Pick<GalleryRecord, 'title' | 'imageUrl' | 'category'>
) {
  await execute(
    `update galleries
     set title = ?, image_url = ?, category = ?
     where id = ?`,
    [input.title, input.imageUrl, input.category, id]
  );
}

export async function deleteGallery(id: string) {
  await execute('delete from galleries where id = ?', [id]);
}

export async function createSyncTestBlog(id: string, slug: string) {
  await execute(
    `insert into blogs (
      id, title, slug, content, category, image_url, author, author_image_url, read_time, likes, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      'TEST_SYNC',
      slug,
      '<p>This is a temporary record to verify Cloudflare D1 synchronization between Admin and Frontend.</p>',
      'Diagnostic',
      null,
      null,
      null,
      null,
      0,
      nowTs(),
    ]
  );
}
