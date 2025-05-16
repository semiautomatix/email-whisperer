1. Run supabase login or set the SUPABASE_ACCESS_TOKEN environment variable:

```bash
npx supabase login
```

2. Link your project:

```bash
npx supabase link --project-ref ikalnmwruutyfsakzzoi
```

3. Create a new migration called "new-migration":

```bash
npx supabase migration new new-migration
```

4. Run all migrations against this project:

```bash
npx supabase db push
```
