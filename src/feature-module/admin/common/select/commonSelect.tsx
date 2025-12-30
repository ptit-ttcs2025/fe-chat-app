import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface OptionType {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  options: OptionType[];
  defaultValue?: string | number;
  className?: string;
  placeholder?: string;
  modal?: boolean;
  onChange?: (value: string | number, option?: OptionType | OptionType[]) => void;
}

const CustomSelect: React.FC<CustomDropdownProps> = ({
  options,
  defaultValue,
  className,
  placeholder,
  modal,
  onChange
}) => {
  return (
    <>
    {modal ? <Select
      defaultValue={defaultValue}
      className={className}
      placeholder={placeholder}
      style={{ width: '100%' }}
      onChange={onChange}
      getPopupContainer={() => (document.getElementsByClassName('modal')[0] as HTMLElement) || document.body} // Access first element or fallback to document.body
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
    :
    <Select
    defaultValue={defaultValue}
    className={className}
    placeholder={placeholder}
    style={{ width: '100%' }}
    onChange={onChange}
  >
    {options.map((option) => (
      <Option key={option.value} value={option.value}>
        {option.label}
      </Option>
    ))}
  </Select>}
    </>
  );
};

export default CustomSelect;
