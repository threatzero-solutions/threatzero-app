import { useCallback, useEffect, useRef } from "react";
import {
  Path,
  PathValue,
  RegisterOptions,
  UseFormRegister,
  UseFormRegisterReturn,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useDebounceCallback } from "usehooks-ts";
import { slugify } from "../utils/core";

type BaseType<F extends string> = Record<F, string> & { slug: string };

interface UseAutoSlugProps<
  F extends string = "name",
  T extends Partial<BaseType<F>> = BaseType<F>
> {
  fromFieldName?: F;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  register: UseFormRegister<T>;
  defaultSlug?: string;
}

export const useAutoSlug = <
  F extends string = "name",
  T extends Partial<BaseType<F>> = BaseType<F>
>({
  fromFieldName = "name" as F,
  watch,
  setValue,
  register,
  defaultSlug,
}: UseAutoSlugProps<F, T>) => {
  const disableAutoSlug = useRef(false);

  // Disable auto slug if initial slug is provided.
  useEffect(() => {
    if (defaultSlug) {
      disableAutoSlug.current = true;
    }
  }, [defaultSlug]);

  const name = watch(fromFieldName as unknown as Path<T>);
  const slug = watch("slug" as Path<T>);

  // Handle setting slug in such a way that avoids unecessary updates
  // or potential infinite loops.
  const setSlug = useCallback(
    (value: PathValue<T, Path<T>>, prevSlug?: PathValue<T, Path<T>>) => {
      if (value) {
        const cleanedSlug = slugify(value as string);
        if (cleanedSlug !== prevSlug) {
          setValue("slug" as Path<T>, cleanedSlug as PathValue<T, Path<T>>);
        }
      }
    },
    [setValue]
  );

  // Auto update slug from name as long as auto slug is not disabled.
  useEffect(() => {
    if (name && !disableAutoSlug.current) {
      setSlug(name);
    }
  }, [name, setSlug]);

  // Additionally, always make sure slug is formatted correctly once the user
  // finishes typing. This is mostly important to remove ending hyphens, which make
  // sense to tolerate while the user is tying but should ultimately be removed.
  const debouncedSetSlug = useDebounceCallback(setSlug, 1000);
  useEffect(() => {
    debouncedSetSlug(slug, slug);
  }, [slug, debouncedSetSlug]);

  const registerSlug = useCallback(
    (options?: RegisterOptions<T, Path<T>>) => {
      const { onChange, onBlur, ...rest } = register(
        "slug" as Path<T>,
        options
      );
      // Intercept onChange to slugify user input and onBlur to disable auto
      // slug once the user interacts with the input.
      return {
        ...rest,
        onChange: (e) => {
          e.target.value = slugify(e.target.value, false);
          return onChange(e);
        },
        onBlur: (e) => {
          disableAutoSlug.current = true;
          return onBlur(e);
        },
      } as UseFormRegisterReturn<Path<T>>;
    },
    [register]
  );

  const resetSlug = useCallback(() => {
    // Reenable auto slug and update slug from name.
    disableAutoSlug.current = false;
    setValue(
      "slug" as Path<T>,
      slugify(name as string) as PathValue<T, Path<T>>
    );
  }, [name, setValue]);

  return {
    registerSlug,
    resetSlug,
  };
};
