// index.tsx
import React, { useEffect, useState } from "react";
import { Table } from "antd";
import type { DatatableProps } from "../../core/data/interface"; // Ensure correct path
 // Ensure correct path


const Datatable: React.FC<DatatableProps> = ({ columns, dataSource , Selection, showSearch = true }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [Selections, setSelections] = useState<any>(true);
  const [filteredDataSource, setFilteredDataSource] = useState(dataSource);

  const onSelectChange = (newSelectedRowKeys: any[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filteredData = dataSource.filter((record) =>
      Object.values(record).some((field) =>
        String(field).toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredDataSource(filteredData);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  
  useEffect(() => {
    setSelections(Selection);
  }, [Selection]);
  
  // Cập nhật filteredDataSource khi dataSource thay đổi
  useEffect(() => {
    setFilteredDataSource(dataSource || []);
    setSearchText(""); // Reset search khi data thay đổi
  }, [dataSource]);
  
  return (
    <>
     {showSearch && (
       <div className="table-top-data">
        <div className="row p-3">
            <div className="col-sm-12 col-md-6">
              <div className="dataTables_length" id="DataTables_Table_0_length">
                
              </div>
            </div>
            <div className="col-sm-12 col-md-6">
              <div id="DataTables_Table_0_filter" className="dataTables_filter text-end">
                <label>
                  {" "}
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Tìm kiếm"
                    aria-controls="DataTables_Table_0"
                    value={searchText} onChange={(e) => handleSearch(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
       </div>
     )}

     <div className="custom-antd-table">
       {!Selections ?
        <Table
        className="table datanew dataTable no-footer"
        columns={columns}
        rowHoverable={false}
        dataSource={filteredDataSource}
        rowKey={(record) => record.id || record.key || Math.random().toString()}
        pagination={{
          locale: { 
            items_per_page: " / trang",
            jump_to: "Đi đến",
            page: "Trang",
            prev_page: "Trang trước",
            next_page: "Trang sau",
            prev_5: "Trước 5 trang",
            next_5: "Sau 5 trang",
          },
          nextIcon: <i className="ti ti-chevron-right"/>,
          prevIcon: <i className="ti ti-chevron-left"/>,
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30"],
          showQuickJumper: false,
        }}
      /> : 
      <Table
          className="table datanew dataTable no-footer"
          rowSelection={rowSelection}
          columns={columns}
          rowHoverable={false}
          dataSource={filteredDataSource}
          rowKey={(record) => record.id || record.key || Math.random().toString()}
          pagination={{
            locale: { 
              items_per_page: " / trang",
              jump_to: "Đi đến",
              page: "Trang",
              prev_page: "Trang trước",
              next_page: "Trang sau",
              prev_5: "Trước 5 trang",
              next_5: "Sau 5 trang",
            },
            nextIcon: <i className="ti ti-chevron-right"/>,
            prevIcon: <i className="ti ti-chevron-left"/>,
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30"],
            showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            showQuickJumper: false,
          }}
        />}
     </div>

     <style>{`
       /* Ẩn text "Row Per Page" và "Entries" mặc định của DataTables */
       .dataTables_length label {
         display: none !important;
       }
       
       .dataTables_info {
         display: none !important;
       }
       
       /* Đảm bảo pagination không đè lên header */
       .custom-antd-table .ant-pagination {
         display: flex !important;
         align-items: center !important;
         gap: 16px !important;
         flex-wrap: wrap !important;
         margin-top: 16px !important;
         padding: 16px 24px !important;
         border-top: 1px solid #e5e7eb !important;
       }
       
       /* Style cho phần hiển thị tổng số */
       .custom-antd-table .ant-pagination-total-text {
         margin-right: auto !important;
       }
       
       /* Đảm bảo pagination options hiển thị đúng */
       .custom-antd-table .ant-pagination-options {
         position: relative !important;
         left: auto !important;
         top: auto !important;
         margin-left: 0 !important;
       }
       
       /* Style cho size changer */
       .custom-antd-table .ant-pagination-options-size-changer {
         display: inline-flex !important;
         align-items: center !important;
       }
     `}</style>
      
    </>
  );
};

export default Datatable;
