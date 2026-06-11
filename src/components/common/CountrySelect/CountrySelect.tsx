"use client";

import React from "react";
import * as Select from "@radix-ui/react-select";
import { useCountries } from "../../../hooks";
import { CountryFlag } from "../CountryFlag";

interface CountrySelectProps {
  id?: string;
  onChange?: (id?: string) => void;
}

export function CountrySelect(props: CountrySelectProps) {
  const countries = useCountries();

  const handleValueChange = React.useCallback(
    (value: string) => {
      props.onChange?.(value === "__none__" ? undefined : value);
    },
    [props.onChange]
  );

  const selectedCountry = React.useMemo(() => {
    return countries?.find((row) => row.id === props.id);
  }, [countries, props.id]);

  const currentValue = props.id ?? "__none__";

  return (
    <Select.Root value={currentValue} onValueChange={handleValueChange}>
      <Select.Trigger
        className="cursor-pointer w-full h-[34px] flex items-center gap-1 px-[2px] border border-[#233042] rounded-input bg-card-body text-dark-navy text-sm outline-none focus:ring-1 focus:ring-[#233042] data-[placeholder]:text-neutral-gray"
      >
        <span className="flex items-center gap-1 overflow-hidden">
          {selectedCountry ? (
            <>
              <CountryFlag code={selectedCountry.code} />
              <span className="truncate">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="ml-1 text-neutral-gray">None</span>
          )}
        </span>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={0}
          className="z-[100000] w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-y-auto bg-[#f6f5f5cc] rounded-card shadow-card border border-neutral-gray/20"
        >
          <Select.Viewport>
            <Select.Item
              value="__none__"
              className="flex items-center gap-1 px-[2px] py-[2px] cursor-pointer text-sm text-dark-navy outline-none data-[highlighted]:bg-[rgba(0,0,0,0.04)]"
            >
              <Select.ItemText>
                <span className="ml-1">None</span>
              </Select.ItemText>
            </Select.Item>

            {(countries ?? []).map((country) => (
              <Select.Item
                key={country.id}
                value={country.id}
                className="flex items-center gap-1 px-[2px] py-[2px] cursor-pointer text-sm text-dark-navy outline-none data-[highlighted]:bg-[rgba(0,0,0,0.04)]"
              >
                <Select.ItemText>
                  <span className="flex items-center gap-1">
                    <CountryFlag code={country.code} />
                    <span>{country.name}</span>
                  </span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
