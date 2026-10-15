// oxjob #1689: Nuxt 4.5 brings @unhead/vue 3 (the app was on 1.x). These are the
// useHead patterns the app uses, rendered by unhead 3, with the titles they gave on 1.x.
import { describe, it, expect } from "vitest";
import { createSSRApp, h, computed, ref, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { useHead } from "@unhead/vue";
import { createHead, renderSSRHead } from "@unhead/vue/server";
import { titleTemplate, companyPageHead } from "@/companyPages.mjs";

async function headFor(setup) {
  const head = createHead({ disableDefaults: true });
  const app = createSSRApp(defineComponent({ setup() { setup(); return () => h("div"); } }));
  app.use(head);
  await renderToString(app);
  return renderSSRHead(head).headTags;
}
// App.vue's two calls, then whatever the view adds.
function appHead(path) {
  useHead({ titleTemplate, link: [], meta: [] });
  useHead(() => companyPageHead(path) ?? {});
}

describe("useHead on unhead 3", () => {
  it("a view's plain title gets the site template", async () => {
    expect(await headFor(() => { appHead("/settings/labs"); useHead({ title: "Labs" }); })).toBe("<title>Labs | OpenAlex</title>");
  });
  it("a computed title stays reactive input", async () => {
    const label = ref("Search");
    expect(await headFor(() => { appHead("/nl"); useHead({ title: computed(() => `${label.value} — Natural language`) }); }))
      .toBe("<title>Search — Natural language | OpenAlex</title>");
  });
  it("a getter input (App.vue, CollectionPublic.vue) works", async () => {
    const tags = await headFor(() => { appHead("/c/x"); useHead(() => ({ title: "Kelp — OpenAlex Collections", meta: [{ name: "robots", content: "noindex" }] })); });
    expect(tags).toContain("<title>Kelp — OpenAlex Collections | OpenAlex</title>");
    expect(tags).toContain('<meta name="robots" content="noindex">');
  });
  it("company pages: titleTemplate null still opts out of the template", async () => {
    expect(await headFor(() => appHead("/"))).toContain("<title>OpenAlex: The open catalog to the global research system</title>");
    const about = await headFor(() => appHead("/about"));
    expect(about).toContain("<title>About | OpenAlex</title>");
    expect(about).toContain('<link rel="canonical" href="https://openalex.org/about">');
  });
  it("no title at all gives the site name", async () => {
    expect(await headFor(() => appHead("/works"))).toBe("<title>OpenAlex</title>");
  });
});
