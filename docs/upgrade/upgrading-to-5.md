---
title: Upgrading from 4 to 5
---

## Deprecation Removals

These previously deprecated members have been removed:

<details><summary>Resource.getKey() -> Resource.key</summary>

Simply rename this to `get key()`

</details>

<details><summary>Resource.getEntitySchema() -> Resource</summary>

This has been simplified to simply use the Resource itself:

<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this.getEntitySchema()], nextPage: '' },
    };
  }
}
```

<!--after-->

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this], nextPage: '' },
    };
  }
}
```

<!--END_DOCUSAURUS_CODE_TABS-->
</details>

## Other breaking changes

<details><summary>yarn add @rest-hooks/test@2 @rest-hooks/legacy@2</summary>

Be sure to also upgrade these libraries if you use them:

- `@rest-hooks/test@2`
- `@rest-hooks/legacy@2`

These libraries don't have any breaking changes within themselves, but
they do require `rest-hooks@5` and (reflexively) `rest-hooks@5` requires
at least v2.

</details>

### Network Definitions (Resource/FetchShape, etc)

<details><summary>FetchShape: {type: 'delete'} -> { type: 'mutate', schema: new schemas.Delete(this) }</summary>

`Resource.deleteShape()` will continue to work as expected. However, if
you defined some custom shapes with type: 'delete'

<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
class MyResource extends Resource {
  static someOtherDeleteShape<T extends typeof SimpleResource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    const options = this.getFetchOptions();
    return {
      // changed
      type: 'delete',
      // changed
      schema: this.asSchema(),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
      },
    };
  }
}
```

<!--after-->

```typescript
import { schemas } from 'rest-hooks';
class MyResource extends Resource {
  static someOtherDeleteShape<T extends typeof SimpleResource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    const options = this.getFetchInit();
    return {
      // changed
      type: 'mutate',
      // changed
      schema: new schemas.Delete(this),
      options,
      getFetchKey: (params: object) => {
        return 'DELETE ' + this.url(params);
      },
      fetch: (params: Readonly<object>) => {
        return this.fetch('delete', this.url(params));
      },
    };
  }
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

</details>

<details><summary>Validation Errors: `This is likely due to a malformed response`</summary>

To aid with common schema definition or networking errors, Rest Hooks
will sometimes throw an error. This only occurs during development, to
help users correctly define their schemas and endpoints.

While the heuristics have been heavily tuned, if you don't believe
the errors reported are valid please [report a bug](https://github.com/coinbase/rest-hooks/issues/new/choose).

When reporting, be sure to include

- The exact network response from the [network inspector](https://developers.google.com/web/tools/chrome-devtools/network)
- The full schema definition.

Alternatively, this can be disabled by adding `static automaticValidation = 'silent' | 'warn'`

```typescript
class MyResource extends Resource {
  static automaticValidation = 'silent' as const;
  // ...
}
```

Warn will no longer throw an error, but still add a message to the browser console.
Silent removes the check completely.

</details>

### Managers

These only apply if you have a custom [Manager](../api/Manager)

<details><summary>action.meta.url -> action.meta.key</summary>

It's recommend to now use the action creators
exported from `@rest-hooks/core`

- [createFetch](../api/createFetch)
- [createReceive](../api/createReceive)
- [createReceiveError](../api/createReceiveError)
</details>

<details><summary>getState()</summary>

This is very unlikely to make a difference, but the internal cache state
(accessible with getState()) might be slightly different. Mutations now
result in entries in `meta` and `results`. This brings them more in line with
reads, making the distinction simply about which hooks they are allowed
in. (To prevent unwanted side effects.)

</details>

### Cache Lifetime Policy

<details><summary>useInvalidator() triggers suspense</summary>

You can likely remove [invalidIfStale](../api/Endpoint#invalidifstale-boolean) if used in conjunction with [useInvalidator()](../api/useInvalidator)

[invalidIfStale](../api/Endpoint#invalidifstale-boolean) is still useful to disable the `stale-while-revalidate` policy.

</details>

<details><summary>`delete` suspends instead of throwing 404</summary>

[Delete](../api/Delete) marks an entity as deleted. _Any_ response requiring
that entity will suspend. Previously it throw a 404 error.

</details>

<details><summary>Missing entities suspend</summary>

Required entities missing from network response will now throw error in useResource() just like other unexpected deserializations.

Use [SimpleRecord](../api/SimpleRecord) for [optional entities](../api/SimpleRecord#optional-members).

<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
const schema = {
  data: MyEntity,
};
```

<!--after-->

```typescript
class OptionalSchema extends SimpleRecord {
  readonly data: MyEntity | null = null;

  static schema = {
    data: MyEntity,
  };
}
const schema = OptionalSchema;
```

<!--END_DOCUSAURUS_CODE_TABS-->
</details>

<details><summary>invalidIfStale</summary>

When [invalidIfStale](../api/Endpoint#invalidifstale-boolean) is true, useCache() and useStatefulResource() will no longer return entities, even if they are in the cache.
This matches the expected behavior that any `loading` data should not be usable.
</details>

## Upgrading from beta versions to final

The last breaking changes introduced to `rest-hook` were in `delta.0` where TTL
and deletes were reworked. If you are on a more recent beta (`i`, `j`, `k`, `rc`),
upgrades should be as simple as updating the version.

If this is not the case, please [report a bug](https://github.com/coinbase/rest-hooks/issues/new/choose).

## Deprecations

After a successful upgrade, it is recommended to adopt the modern practices.

<details><summary>Resource.getFetchOptions() -> Resource.getFetchInit()</summary>


<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
class AuthdResource extends Resource {
  static getFetchOptions = (options: RequestInit) => ({
    ...options,
    credentials: 'same-origin',
  });
}
```

<!--after-->

```typescript
class AuthdResource extends Resource {
  static getFetchInit = (init: RequestInit) => ({
    ...init,
    credentials: 'same-origin',
  });
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

(Resource.getFetchInit())../api/resource#static-getfetchinitinit-requestinit-requestinit)
</details>

<details><summary>Resource.asSchema() -> Resource</summary>

This has been simplified to simply use the Resource itself:

<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this.asSchema()], nextPage: '' },
    };
  }
}
```

<!--after-->

```typescript
class MyResource extends Resource {
  static customEndpoint<T extends typeof MyResource>(this: T) {
    return {
      ...super.listShape(),
      // notice the next line
      schema: { results: [this], nextPage: '' },
    };
  }
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

</details>

<details><summary>FetchShape -> Endpoint</summary>
</details>


### @rest-hooks/rest


<details><summary>yarn add @rest-hooks/rest</summary>

Rest Hooks is protocol agnostic, so the REST/CRUD specific class [Resource](../api/resource)
will eventually be fully deprecated and removed. `@rest-hooks/rest` is intended as its
replacement. Other supplementary libraries like `@rest-hooks/graphql` could be
added in the future, for intance. This is also beneficial as these libraries
change more frequently than the core of rest hooks.

<!--DOCUSAURUS_CODE_TABS-->
<!--before-->

```typescript
import { Resource } from 'rest-hooks';

class MyResource extends Resource {
}
```

<!--after-->

```typescript
import { Resource } from '@rest-hooks/rest';

class MyResource extends Resource {
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

> Breaking change:
>
> Nested entities `static schema` will return from `useResource()`

</details>

<details><summary>static schema</summary>

../guides/nested-response

</details>


[Full Release notes](https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%405.0.0)
