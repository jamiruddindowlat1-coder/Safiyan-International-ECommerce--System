import { useEffect, useState } from "react";
import { orderService } from "../../services/orderService";
import { SIES_BRANDING } from "../../config/branding";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function VendorOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [message, setMessage] = useState("");

    // Order Details Modal
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            const data = await orderService.getOrders();

            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(
                "Failed to load vendor orders:",
                error
            );

            setOrders([]);
            setMessage(
                "Failed to load vendor orders."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatCurrency = (amount) => {
        return `৳${Number(
            amount || 0
        ).toLocaleString("en-BD")}`;
    };

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        try {
            return new Date(value).toLocaleString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );
        } catch {
            return value;
        }
    };

    const getStatusStyle = (status) => {
        const value = String(
            status || ""
        ).toLowerCase();

        if (value === "delivered") {
            return {
                background: "#dcfce7",
                color: "#166534",
            };
        }

        if (value === "cancelled") {
            return {
                background: "#fee2e2",
                color: "#991b1b",
            };
        }

        if (
            value === "processing" ||
            value === "shipped"
        ) {
            return {
                background: "#dbeafe",
                color: "#1e40af",
            };
        }

        return {
            background: "#fef3c7",
            color: "#92400e",
        };
    };

    const getPaymentStatusStyle = (
        status
    ) => {
        const value = String(
            status || ""
        ).toLowerCase();

        if (
            value === "paid" ||
            value === "completed" ||
            value === "success" ||
            value === "successful"
        ) {
            return {
                background: "#dcfce7",
                color: "#166534",
            };
        }

        if (
            value === "failed" ||
            value === "cancelled"
        ) {
            return {
                background: "#fee2e2",
                color: "#991b1b",
            };
        }

        return {
            background: "#fef3c7",
            color: "#92400e",
        };
    };

    const getLogoBase64 = () => {
        return new Promise((resolve) => {
            const img = new Image();

            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    canvas.width =
                        img.naturalWidth ||
                        img.width;

                    canvas.height =
                        img.naturalHeight ||
                        img.height;

                    const context =
                        canvas.getContext(
                            "2d"
                        );

                    if (!context) {
                        resolve(null);
                        return;
                    }

                    context.drawImage(
                        img,
                        0,
                        0
                    );

                    resolve(
                        canvas.toDataURL(
                            "image/png"
                        )
                    );
                } catch (error) {
                    console.error(
                        "Logo conversion failed:",
                        error
                    );

                    resolve(null);
                }
            };

            img.onerror = () =>
                resolve(null);

            img.src =
                SIES_BRANDING.logo;
        });
    };

    const handleStatusUpdate = async (
        orderId,
        status,
        statusLabel
    ) => {
        const order = orders.find(
            (item) =>
                item.id === orderId
        );

        if (!order) {
            setMessage(
                "Order not found."
            );
            return;
        }

        if (status === 5) {
            const confirmed =
                window.confirm(
                    `Are you sure you want to cancel order ${order.orderNumber}?`
                );

            if (!confirmed) {
                return;
            }
        }

        try {
            setUpdatingId(orderId);
            setMessage("");

            await orderService.updateStatus(
                orderId,
                status
            );

            setMessage(
                `${order.orderNumber} status updated to ${statusLabel}.`
            );

            await fetchOrders();
        } catch (error) {
            console.error(
                "Failed to update order status:",
                error
            );

            setMessage(
                error?.message ||
                    "Failed to update order status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    /*
     * VIEW ORDER DETAILS
     */
    const handleView = async (
        orderId
    ) => {
        try {
            setDetailsLoading(true);
            setMessage("");

            const order =
                await orderService.getOrder(
                    orderId
                );

            if (!order) {
                setMessage(
                    "Order details not found."
                );
                return;
            }

            setSelectedOrder(order);
            setShowDetailsModal(true);
        } catch (error) {
            console.error(
                "Failed to load order details:",
                error
            );

            setMessage(
                "Failed to load order details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedOrder(null);
    };

    /*
     * NORMALIZE ORDER ITEMS
     *
     * Supports common backend property names
     * without changing backend data.
     */
    const getOrderItems = (order) => {
        if (!order) {
            return [];
        }

        if (
            Array.isArray(
                order.items
            )
        ) {
            return order.items;
        }

        if (
            Array.isArray(
                order.orderItems
            )
        ) {
            return order.orderItems;
        }

        if (
            Array.isArray(
                order.orderDetails
            )
        ) {
            return order.orderDetails;
        }

        if (
            Array.isArray(
                order.details
            )
        ) {
            return order.details;
        }

        return [];
    };

    const getItemName = (item) => {
        return (
            item.productName ||
            item.name ||
            item.product?.name ||
            item.product?.title ||
            item.title ||
            `Product #${
                item.productId ||
                item.product?.id ||
                "-"
            }`
        );
    };

    const getItemQuantity = (item) => {
        return Number(
            item.quantity ??
                item.qty ??
                1
        );
    };

    const getItemUnitPrice = (
        item
    ) => {
        return Number(
            item.unitPrice ??
                item.price ??
                item.productPrice ??
                item.product?.price ??
                0
        );
    };

    const getItemTotal = (item) => {
        const explicitTotal =
            item.total ??
            item.lineTotal ??
            item.subtotal ??
            item.totalPrice;

        if (
            explicitTotal !==
                undefined &&
            explicitTotal !== null
        ) {
            return Number(
                explicitTotal || 0
            );
        }

        return (
            getItemQuantity(item) *
            getItemUnitPrice(item)
        );
    };

    const getCustomerName = (
        order
    ) => {
        return (
            order?.customerName ||
            order?.shippingName ||
            order?.customer?.name ||
            order?.user?.name ||
            "-"
        );
    };

    const getCustomerPhone = (
        order
    ) => {
        return (
            order?.customerPhone ||
            order?.shippingPhone ||
            order?.phone ||
            order?.customer?.phone ||
            order?.user?.phone ||
            "-"
        );
    };

    const getPaymentStatus = (
        order
    ) => {
        return (
            order?.paymentStatus ||
            order?.payment?.status ||
            "Pending"
        );
    };

    const getPaymentMethod = (
        order
    ) => {
        return (
            order?.paymentMethod ||
            order?.payment?.method ||
            order?.payment?.paymentMethod ||
            "-"
        );
    };

    const getOrderDate = (order) => {
        return (
            order?.createdAt ||
            order?.orderDate ||
            order?.date ||
            order?.createdDate ||
            null
        );
    };

    const getShippingAddress = (
        order
    ) => {
        if (
            order?.shippingAddress
        ) {
            if (
                typeof order.shippingAddress ===
                "string"
            ) {
                return order.shippingAddress;
            }

            const address =
                order.shippingAddress;

            return [
                address.address,
                address.street,
                address.city,
                address.postCode ||
                    address.postalCode ||
                    address.zipCode,
                address.country,
            ]
                .filter(Boolean)
                .join(", ");
        }

        return [
            order?.address,
            order?.shippingAddressLine,
            order?.city,
            order?.postCode ||
                order?.postalCode ||
                order?.zipCode,
            order?.country,
        ]
            .filter(Boolean)
            .join(", ");
    };

    /*
     * PRINT ORDER DETAILS
     */
    const handlePrintOrderDetails =
        () => {
            if (!selectedOrder) {
                return;
            }

            const order =
                selectedOrder;

            const items =
                getOrderItems(order);

            const printWindow =
                window.open(
                    "",
                    "_blank"
                );

            if (!printWindow) {
                alert(
                    "Please allow pop-ups to print order details."
                );
                return;
            }

            const itemRows =
                items.length > 0
                    ? items
                          .map(
                              (
                                  item,
                                  index
                              ) => `
                                <tr>
                                    <td>${
                                        index +
                                        1
                                    }</td>
                                    <td>${getItemName(
                                        item
                                    )}</td>
                                    <td>${getItemQuantity(
                                        item
                                    )}</td>
                                    <td>${formatCurrency(
                                        getItemUnitPrice(
                                            item
                                        )
                                    )}</td>
                                    <td>${formatCurrency(
                                        getItemTotal(
                                            item
                                        )
                                    )}</td>
                                </tr>
                            `
                          )
                          .join("")
                    : `
                        <tr>
                            <td colspan="5" style="text-align:center;">
                                No order items found
                            </td>
                        </tr>
                    `;

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />

                    <title>
                        ${SIES_BRANDING.name}
                        -
                        Order Details
                    </title>

                    <style>
                        @page {
                            size: A4;
                            margin: 16mm;
                        }

                        * {
                            box-sizing: border-box;
                        }

                        body {
                            margin: 0;
                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;
                            color: #111827;
                            background: #ffffff;
                        }

                        .header {
                            display: flex;
                            align-items: center;
                            gap: 14px;
                            padding-bottom: 12px;
                            border-bottom:
                                2px solid
                                ${SIES_BRANDING.colors.primary};
                        }

                        .logo {
                            width: 55px;
                            height: 55px;
                            object-fit: contain;
                        }

                        .brand-name {
                            font-size: 18px;
                            font-weight: 800;
                            color:
                                ${SIES_BRANDING.colors.primary};
                        }

                        .brand-short {
                            margin-top: 3px;
                            color: #64748b;
                            font-size: 11px;
                        }

                        .title {
                            margin-top: 20px;
                            font-size: 21px;
                            font-weight: 800;
                            color: #111827;
                        }

                        .order-number {
                            margin-top: 5px;
                            color: #64748b;
                            font-size: 11px;
                        }

                        .grid {
                            display: grid;
                            grid-template-columns:
                                1fr 1fr;
                            gap: 12px;
                            margin-top: 18px;
                        }

                        .card {
                            border:
                                1px solid
                                #e5e7eb;
                            border-radius: 8px;
                            padding: 12px;
                        }

                        .label {
                            color: #64748b;
                            font-size: 10px;
                            margin-bottom: 4px;
                        }

                        .value {
                            color: #111827;
                            font-size: 12px;
                            font-weight: 700;
                        }

                        table {
                            width: 100%;
                            border-collapse:
                                collapse;
                            margin-top: 20px;
                        }

                        th {
                            background:
                                ${SIES_BRANDING.colors.primary};
                            color: #ffffff;
                            padding: 9px;
                            text-align: left;
                            font-size: 10px;
                        }

                        td {
                            border:
                                1px solid
                                #d1d5db;
                            padding: 8px;
                            font-size: 10px;
                        }

                        .total {
                            margin-top: 14px;
                            text-align: right;
                            font-size: 16px;
                            font-weight: 800;
                            color:
                                ${SIES_BRANDING.colors.primary};
                        }

                        .footer {
                            margin-top: 28px;
                            padding-top: 10px;
                            border-top:
                                1px solid
                                #d1d5db;
                            text-align: center;
                            color: #64748b;
                            font-size: 9px;
                        }
                    </style>
                </head>

                <body>
                    <div class="header">
                        <img
                            class="logo"
                            src="${SIES_BRANDING.logo}"
                            alt="SIES Logo"
                        />

                        <div>
                            <div class="brand-name">
                                ${SIES_BRANDING.name}
                            </div>

                            <div class="brand-short">
                                ${SIES_BRANDING.shortName}
                                |
                                Vendor Order Details
                            </div>
                        </div>
                    </div>

                    <div class="title">
                        Order Details
                    </div>

                    <div class="order-number">
                        Order Number:
                        <strong>
                            ${
                                order.orderNumber ||
                                "-"
                            }
                        </strong>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <div class="label">
                                Customer
                            </div>
                            <div class="value">
                                ${getCustomerName(
                                    order
                                )}
                            </div>
                        </div>

                        <div class="card">
                            <div class="label">
                                Phone
                            </div>
                            <div class="value">
                                ${getCustomerPhone(
                                    order
                                )}
                            </div>
                        </div>

                        <div class="card">
                            <div class="label">
                                Order Status
                            </div>
                            <div class="value">
                                ${
                                    order.status ||
                                    "-"
                                }
                            </div>
                        </div>

                        <div class="card">
                            <div class="label">
                                Payment Status
                            </div>
                            <div class="value">
                                ${getPaymentStatus(
                                    order
                                )}
                            </div>
                        </div>

                        <div class="card">
                            <div class="label">
                                Payment Method
                            </div>
                            <div class="value">
                                ${getPaymentMethod(
                                    order
                                )}
                            </div>
                        </div>

                        <div class="card">
                            <div class="label">
                                Order Date
                            </div>
                            <div class="value">
                                ${formatDate(
                                    getOrderDate(
                                        order
                                    )
                                )}
                            </div>
                        </div>

                        <div class="card" style="grid-column: 1 / -1;">
                            <div class="label">
                                Shipping Address
                            </div>
                            <div class="value">
                                ${
                                    getShippingAddress(
                                        order
                                    ) ||
                                    "-"
                                }
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>

                    <div class="total">
                        Total Amount:
                        ${formatCurrency(
                            order.totalAmount
                        )}
                    </div>

                    <div class="footer">
                        ${SIES_BRANDING.name}
                        |
                        ${SIES_BRANDING.shortName}
                        |
                        Vendor Order Details
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
            }, 400);
        };

    /*
     * PDF ORDER DETAILS
     */
    const handleExportOrderPdf =
        async () => {
            if (!selectedOrder) {
                return;
            }

            try {
                const order =
                    selectedOrder;

                const doc =
                    new jsPDF(
                        "portrait",
                        "mm",
                        "a4"
                    );

                const pageWidth =
                    doc.internal.pageSize.getWidth();

                const pageHeight =
                    doc.internal.pageSize.getHeight();

                const logoBase64 =
                    await getLogoBase64();

                if (logoBase64) {
                    try {
                        doc.addImage(
                            logoBase64,
                            "PNG",
                            14,
                            8,
                            20,
                            20
                        );
                    } catch (
                        error
                    ) {
                        console.warn(
                            "Could not add SIES logo:",
                            error
                        );
                    }
                }

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(
                    15
                );

                doc.setTextColor(
                    15,
                    76,
                    129
                );

                doc.text(
                    SIES_BRANDING.name,
                    40,
                    15
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(9);

                doc.setTextColor(
                    107,
                    114,
                    128
                );

                doc.text(
                    `${SIES_BRANDING.shortName} | Vendor Order Details`,
                    40,
                    21
                );

                doc.setDrawColor(
                    15,
                    76,
                    129
                );

                doc.setLineWidth(
                    0.7
                );

                doc.line(
                    14,
                    32,
                    pageWidth - 14,
                    32
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(
                    16
                );

                doc.setTextColor(
                    17,
                    24,
                    39
                );

                doc.text(
                    "Order Details",
                    14,
                    42
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(9);

                doc.setTextColor(
                    107,
                    114,
                    128
                );

                doc.text(
                    `Order Number: ${
                        order.orderNumber ||
                        "-"
                    }`,
                    14,
                    49
                );

                const detailRows = [
                    [
                        "Customer",
                        getCustomerName(
                            order
                        ),
                        "Phone",
                        getCustomerPhone(
                            order
                        ),
                    ],
                    [
                        "Order Status",
                        order.status ||
                            "-",
                        "Payment Status",
                        getPaymentStatus(
                            order
                        ),
                    ],
                    [
                        "Payment Method",
                        getPaymentMethod(
                            order
                        ),
                        "Order Date",
                        formatDate(
                            getOrderDate(
                                order
                            )
                        ),
                    ],
                    [
                        "Shipping Address",
                        getShippingAddress(
                            order
                        ) || "-",
                        "",
                        "",
                    ],
                ];

                autoTable(doc, {
                    startY: 56,

                    body: detailRows,

                    theme: "grid",

                    styles: {
                        font:
                            "helvetica",
                        fontSize: 9,
                        cellPadding: 3,
                        lineColor: [
                            209,
                            213,
                            219,
                        ],
                        lineWidth: 0.2,
                        textColor: [
                            17,
                            24,
                            39,
                        ],
                    },

                    columnStyles: {
                        0: {
                            fontStyle:
                                "bold",
                            fillColor: [
                                248,
                                250,
                                252,
                            ],
                            cellWidth: 30,
                        },
                        1: {
                            cellWidth: 58,
                        },
                        2: {
                            fontStyle:
                                "bold",
                            fillColor: [
                                248,
                                250,
                                252,
                            ],
                            cellWidth: 30,
                        },
                        3: {
                            cellWidth: 58,
                        },
                    },

                    margin: {
                        left: 14,
                        right: 14,
                    },

                    didParseCell:
                        (data) => {
                            if (
                                data.row.index ===
                                    3 &&
                                data.column.index ===
                                    1
                            ) {
                                data.cell.colSpan = 3;
                            }
                        },
                });

                const items =
                    getOrderItems(
                        order
                    );

                const tableBody =
                    items.map(
                        (
                            item,
                            index
                        ) => [
                            index + 1,
                            getItemName(
                                item
                            ),
                            getItemQuantity(
                                item
                            ),
                            formatCurrency(
                                getItemUnitPrice(
                                    item
                                )
                            ),
                            formatCurrency(
                                getItemTotal(
                                    item
                                )
                            ),
                        ]
                    );

                const startY =
                    doc.lastAutoTable
                        .finalY + 10;

                autoTable(doc, {
                    startY,

                    head: [
                        [
                            "#",
                            "Product",
                            "Qty",
                            "Unit Price",
                            "Total",
                        ],
                    ],

                    body:
                        tableBody.length >
                        0
                            ? tableBody
                            : [
                                  [
                                      "-",
                                      "No order items found",
                                      "-",
                                      "-",
                                      "-",
                                  ],
                              ],

                    theme: "grid",

                    styles: {
                        font:
                            "helvetica",
                        fontSize: 8.5,
                        cellPadding: 3,
                        lineColor: [
                            209,
                            213,
                            219,
                        ],
                        lineWidth: 0.2,
                        textColor: [
                            17,
                            24,
                            39,
                        ],
                    },

                    headStyles: {
                        fillColor: [
                            15,
                            76,
                            129,
                        ],
                        textColor: [
                            255,
                            255,
                            255,
                        ],
                        fontStyle:
                            "bold",
                    },

                    alternateRowStyles: {
                        fillColor: [
                            248,
                            250,
                            252,
                        ],
                    },

                    margin: {
                        left: 14,
                        right: 14,
                        bottom: 20,
                    },
                });

                const totalY =
                    doc.lastAutoTable
                        .finalY + 9;

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(
                    13
                );

                doc.setTextColor(
                    15,
                    76,
                    129
                );

                doc.text(
                    `Total Amount: ${formatCurrency(
                        order.totalAmount
                    )}`,
                    pageWidth - 14,
                    totalY,
                    {
                        align: "right",
                    }
                );

                const pageCount =
                    doc.internal.getNumberOfPages();

                for (
                    let page = 1;
                    page <= pageCount;
                    page++
                ) {
                    doc.setPage(page);

                    doc.setDrawColor(
                        229,
                        231,
                        235
                    );

                    doc.setLineWidth(
                        0.3
                    );

                    doc.line(
                        14,
                        pageHeight - 14,
                        pageWidth - 14,
                        pageHeight - 14
                    );

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(8);

                    doc.setTextColor(
                        107,
                        114,
                        128
                    );

                    doc.text(
                        `${SIES_BRANDING.name} | ${SIES_BRANDING.shortName} | Order Details`,
                        14,
                        pageHeight - 8
                    );

                    doc.text(
                        `Page ${page} of ${pageCount}`,
                        pageWidth - 14,
                        pageHeight - 8,
                        {
                            align: "right",
                        }
                    );
                }

                doc.save(
                    `SIES-Order-${
                        order.orderNumber ||
                        order.id
                    }.pdf`
                );
            } catch (error) {
                console.error(
                    "Order Details PDF export failed:",
                    error
                );

                alert(
                    "Failed to generate Order Details PDF."
                );
            }
        };

    /*
     * PRINT ALL VENDOR ORDERS
     */
    const handlePrint = () => {
        const printWindow =
            window.open(
                "",
                "_blank"
            );

        if (!printWindow) {
            alert(
                "Please allow pop-ups to print the Vendor Orders report."
            );
            return;
        }

        const rows = orders
            .map(
                (order) => `
                    <tr>
                        <td>${order.orderNumber || "-"}</td>
                        <td>${order.customerName || "-"}</td>
                        <td>${formatCurrency(order.totalAmount)}</td>
                        <td>${order.status || "-"}</td>
                    </tr>
                `
            )
            .join("");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />

                <title>
                    ${SIES_BRANDING.name} - Vendor Orders
                </title>

                <style>
                    @page {
                        size: A4 landscape;
                        margin: 18mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        font-family: Arial, Helvetica, sans-serif;
                        color: #111827;
                        background: #ffffff;
                    }

                    .brand-header {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        padding-bottom: 12px;
                        border-bottom: 2px solid ${SIES_BRANDING.colors.primary};
                    }

                    .brand-logo {
                        width: 52px;
                        height: 52px;
                        object-fit: contain;
                    }

                    .brand-name {
                        font-size: 19px;
                        font-weight: 800;
                        color: ${SIES_BRANDING.colors.primary};
                    }

                    .brand-short {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 3px;
                    }

                    .report-title {
                        margin-top: 20px;
                        font-size: 20px;
                        font-weight: 800;
                    }

                    .report-meta {
                        margin-top: 6px;
                        margin-bottom: 18px;
                        color: #6b7280;
                        font-size: 11px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th {
                        background: ${SIES_BRANDING.colors.primary};
                        color: #ffffff;
                        padding: 10px;
                        text-align: left;
                        font-size: 11px;
                    }

                    td {
                        border: 1px solid #d1d5db;
                        padding: 9px;
                        font-size: 11px;
                    }

                    tbody tr:nth-child(even) {
                        background: #f8fafc;
                    }

                    .footer {
                        margin-top: 25px;
                        padding-top: 10px;
                        border-top: 1px solid #d1d5db;
                        text-align: center;
                        font-size: 9px;
                        color: #6b7280;
                    }
                </style>
            </head>

            <body>
                <div class="brand-header">
                    <img
                        class="brand-logo"
                        src="${SIES_BRANDING.logo}"
                        alt="SIES Logo"
                    />

                    <div>
                        <div class="brand-name">
                            ${SIES_BRANDING.name}
                        </div>

                        <div class="brand-short">
                            ${SIES_BRANDING.shortName}
                        </div>
                    </div>
                </div>

                <div class="report-title">
                    Vendor Orders
                </div>

                <div class="report-meta">
                    Total Orders: ${orders.length}
                    &nbsp; | &nbsp;
                    Generated:
                    ${new Date().toLocaleString("en-GB")}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Customer</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            rows ||
                            `
                                <tr>
                                    <td
                                        colspan="4"
                                        style="text-align:center;"
                                    >
                                        No orders found
                                    </td>
                                </tr>
                            `
                        }
                    </tbody>
                </table>

                <div class="footer">
                    ${SIES_BRANDING.name}
                    |
                    ${SIES_BRANDING.shortName}
                    |
                    Vendor Orders Report
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 400);
    };

    /*
     * EXPORT ALL ORDERS PDF
     */
    const handleExportPdf =
        async () => {
            try {
                const doc =
                    new jsPDF(
                        "landscape",
                        "mm",
                        "a4"
                    );

                const pageWidth =
                    doc.internal.pageSize.getWidth();

                const pageHeight =
                    doc.internal.pageSize.getHeight();

                const logoBase64 =
                    await getLogoBase64();

                if (logoBase64) {
                    try {
                        doc.addImage(
                            logoBase64,
                            "PNG",
                            14,
                            8,
                            20,
                            20
                        );
                    } catch (
                        error
                    ) {
                        console.warn(
                            "Could not add SIES logo:",
                            error
                        );
                    }
                }

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(16);

                doc.setTextColor(
                    15,
                    76,
                    129
                );

                doc.text(
                    SIES_BRANDING.name,
                    40,
                    15
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(9);

                doc.setTextColor(
                    107,
                    114,
                    128
                );

                doc.text(
                    `${SIES_BRANDING.shortName} | Vendor Management`,
                    40,
                    21
                );

                doc.setDrawColor(
                    15,
                    76,
                    129
                );

                doc.setLineWidth(0.7);

                doc.line(
                    14,
                    32,
                    pageWidth - 14,
                    32
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(15);

                doc.setTextColor(
                    17,
                    24,
                    39
                );

                doc.text(
                    "Vendor Orders",
                    14,
                    42
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(9);

                doc.setTextColor(
                    107,
                    114,
                    128
                );

                doc.text(
                    `Total Orders: ${orders.length}`,
                    14,
                    49
                );

                doc.text(
                    `Generated: ${new Date().toLocaleString("en-GB")}`,
                    pageWidth - 14,
                    49,
                    {
                        align: "right",
                    }
                );

                const tableBody =
                    orders.map(
                        (order) => [
                            order.orderNumber ||
                                "-",
                            order.customerName ||
                                "-",
                            formatCurrency(
                                order.totalAmount
                            ),
                            order.status ||
                                "-",
                        ]
                    );

                autoTable(doc, {
                    startY: 56,

                    head: [
                        [
                            "Order Number",
                            "Customer",
                            "Total Amount",
                            "Status",
                        ],
                    ],

                    body:
                        tableBody.length >
                        0
                            ? tableBody
                            : [
                                  [
                                      "-",
                                      "No orders found",
                                      "-",
                                      "-",
                                  ],
                              ],

                    theme: "grid",

                    styles: {
                        font:
                            "helvetica",
                        fontSize: 9,
                        cellPadding: 3,
                        lineColor: [
                            209,
                            213,
                            219,
                        ],
                        lineWidth: 0.2,
                        textColor: [
                            17,
                            24,
                            39,
                        ],
                    },

                    headStyles: {
                        fillColor: [
                            15,
                            76,
                            129,
                        ],
                        textColor: [
                            255,
                            255,
                            255,
                        ],
                        fontStyle:
                            "bold",
                    },

                    alternateRowStyles: {
                        fillColor: [
                            248,
                            250,
                            252,
                        ],
                    },

                    margin: {
                        left: 14,
                        right: 14,
                        bottom: 18,
                    },
                });

                const pageCount =
                    doc.internal.getNumberOfPages();

                for (
                    let page = 1;
                    page <= pageCount;
                    page++
                ) {
                    doc.setPage(page);

                    doc.setDrawColor(
                        229,
                        231,
                        235
                    );

                    doc.setLineWidth(
                        0.3
                    );

                    doc.line(
                        14,
                        pageHeight - 14,
                        pageWidth - 14,
                        pageHeight - 14
                    );

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(8);

                    doc.setTextColor(
                        107,
                        114,
                        128
                    );

                    doc.text(
                        `${SIES_BRANDING.name} | ${SIES_BRANDING.shortName} | Vendor Orders`,
                        14,
                        pageHeight - 8
                    );

                    doc.text(
                        `Page ${page} of ${pageCount}`,
                        pageWidth - 14,
                        pageHeight - 8,
                        {
                            align: "right",
                        }
                    );
                }

                doc.save(
                    `SIES-Vendor-Orders-${new Date()
                        .toISOString()
                        .slice(0, 10)}.pdf`
                );
            } catch (error) {
                console.error(
                    "Vendor Orders PDF export failed:",
                    error
                );

                alert(
                    "Failed to generate PDF."
                );
            }
        };

    /*
     * EXPORT EXCEL
     */
    const handleExportExcel =
        () => {
            try {
                const rows = [
                    [SIES_BRANDING.name],

                    [
                        `${SIES_BRANDING.shortName} | Vendor Orders`,
                    ],

                    [
                        `Generated: ${new Date().toLocaleString(
                            "en-GB"
                        )}`,
                    ],

                    [],

                    [
                        "Order Number",
                        "Customer",
                        "Total Amount",
                        "Status",
                    ],

                    ...orders.map(
                        (order) => [
                            order.orderNumber ||
                                "-",
                            order.customerName ||
                                "-",
                            Number(
                                order.totalAmount ||
                                    0
                            ),
                            order.status ||
                                "-",
                        ]
                    ),
                ];

                const worksheet =
                    XLSX.utils.aoa_to_sheet(
                        rows
                    );

                worksheet["!cols"] = [
                    {
                        wch: 30,
                    },
                    {
                        wch: 28,
                    },
                    {
                        wch: 18,
                    },
                    {
                        wch: 18,
                    },
                ];

                worksheet["!merges"] = [
                    {
                        s: {
                            r: 0,
                            c: 0,
                        },
                        e: {
                            r: 0,
                            c: 3,
                        },
                    },
                    {
                        s: {
                            r: 1,
                            c: 0,
                        },
                        e: {
                            r: 1,
                            c: 3,
                        },
                    },
                    {
                        s: {
                            r: 2,
                            c: 0,
                        },
                        e: {
                            r: 2,
                            c: 3,
                        },
                    },
                ];

                const workbook =
                    XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "Vendor Orders"
                );

                XLSX.writeFile(
                    workbook,
                    `SIES-Vendor-Orders-${new Date()
                        .toISOString()
                        .slice(0, 10)}.xlsx`
                );
            } catch (error) {
                console.error(
                    "Vendor Orders Excel export failed:",
                    error
                );

                alert(
                    "Failed to export Excel."
                );
            }
        };

    const getActionButtons = (
        order
    ) => {
        const status = String(
            order.status || ""
        ).toLowerCase();

        const isUpdating =
            updatingId === order.id;

        const buttons = [
            {
                label: "View",
                action: () =>
                    handleView(
                        order.id
                    ),
                color: "#475569",
            },
        ];

        if (status === "pending") {
            buttons.push(
                {
                    label: "Processing",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            2,
                            "Processing"
                        ),
                    color: "#2563eb",
                },
                {
                    label: "Cancel",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            5,
                            "Cancelled"
                        ),
                    color: "#b91c1c",
                }
            );
        }

        if (
            status === "processing"
        ) {
            buttons.push(
                {
                    label: "Shipped",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            3,
                            "Shipped"
                        ),
                    color: "#7c3aed",
                },
                {
                    label: "Cancel",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            5,
                            "Cancelled"
                        ),
                    color: "#b91c1c",
                }
            );
        }

        if (
            status === "shipped"
        ) {
            buttons.push(
                {
                    label: "Delivered",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            4,
                            "Delivered"
                        ),
                    color: "#15803d",
                },
                {
                    label: "Cancel",
                    action: () =>
                        handleStatusUpdate(
                            order.id,
                            5,
                            "Cancelled"
                        ),
                    color: "#b91c1c",
                }
            );
        }

        return buttons.map(
            (
                button,
                index
            ) => (
                <button
                    key={`${button.label}-${index}`}
                    type="button"
                    disabled={
                        isUpdating
                    }
                    onClick={
                        button.action
                    }
                    style={{
                        ...actionButtonStyle(
                            button.color
                        ),
                        opacity:
                            isUpdating
                                ? 0.6
                                : 1,
                    }}
                >
                    {isUpdating &&
                    button.label !==
                        "View"
                        ? "Updating..."
                        : button.label}
                </button>
            )
        );
    };

    return (
        <section
            style={{
                padding: "20px",
                background:
                    "#f8fafc",
                minHeight: "100%",
            }}
        >
            {/* BRAND HEADER */}
            <div
                style={{
                    background:
                        "#ffffff",
                    borderRadius: 12,
                    padding:
                        "18px 20px",
                    marginBottom: 18,
                    border:
                        "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "center",
                    gap: 16,
                    flexWrap:
                        "wrap",
                }}
            >
                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap: 14,
                    }}
                >
                    <img
                        src={
                            SIES_BRANDING.logo
                        }
                        alt={`${SIES_BRANDING.shortName} Logo`}
                        style={{
                            width: 52,
                            height: 52,
                            objectFit:
                                "contain",
                        }}
                    />

                    <div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color:
                                    SIES_BRANDING
                                        .colors
                                        .primary,
                            }}
                        >
                            {
                                SIES_BRANDING.name
                            }
                        </div>

                        <div
                            style={{
                                fontSize: 12,
                                color:
                                    "#6b7280",
                                marginTop: 3,
                            }}
                        >
                            {
                                SIES_BRANDING
                                    .shortName
                            }
                            {" • "}
                            Vendor Management
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display:
                            "flex",
                        gap: 8,
                        flexWrap:
                            "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={
                            fetchOrders
                        }
                        style={buttonStyle(
                            "#475569"
                        )}
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={
                            handlePrint
                        }
                        style={buttonStyle(
                            "#0f766e"
                        )}
                    >
                        Print
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleExportPdf
                        }
                        style={buttonStyle(
                            "#b91c1c"
                        )}
                    >
                        PDF
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleExportExcel
                        }
                        style={buttonStyle(
                            "#166534"
                        )}
                    >
                        Excel
                    </button>
                </div>
            </div>

            {/* PAGE TITLE */}
            <div
                style={{
                    background:
                        "#ffffff",
                    border:
                        "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding:
                        "18px 20px",
                    marginBottom: 16,
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        color:
                            SIES_BRANDING
                                .colors
                                .primary,
                        fontSize: 24,
                    }}
                >
                    Vendor Orders
                </h1>

                <p
                    style={{
                        margin:
                            "6px 0 0",
                        color:
                            "#64748b",
                        fontSize: 14,
                    }}
                >
                    Manage and review
                    orders associated
                    with your vendor
                    account.
                </p>
            </div>

            {/* MESSAGE */}
            {message && (
                <div
                    style={{
                        marginBottom: 16,
                        padding:
                            "12px 14px",
                        borderRadius: 8,
                        background:
                            "#eff6ff",
                        border:
                            "1px solid #bfdbfe",
                        color:
                            "#1e40af",
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    {message}
                </div>
            )}

            {/* ORDERS */}
            <div
                style={{
                    background:
                        "#ffffff",
                    borderRadius: 12,
                    border:
                        "1px solid #e5e7eb",
                    overflowX:
                        "auto",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            padding: 30,
                            textAlign:
                                "center",
                            color:
                                "#64748b",
                        }}
                    >
                        Loading vendor
                        orders...
                    </div>
                ) : orders.length ===
                  0 ? (
                    <div
                        style={{
                            padding: 40,
                            textAlign:
                                "center",
                            color:
                                "#64748b",
                        }}
                    >
                        No vendor orders
                        found.
                    </div>
                ) : (
                    <div
                        style={{
                            minWidth:
                                1150,
                        }}
                    >
                        {/* HEADER */}
                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "1.5fr 1.3fr 1fr 0.9fr 2.6fr",
                                gap: 12,
                                background:
                                    "#f1f5f9",
                                padding:
                                    "14px 16px",
                                color:
                                    "#334155",
                                fontSize: 13,
                                borderBottom:
                                    "1px solid #e2e8f0",
                            }}
                        >
                            <strong>
                                Order Number
                            </strong>

                            <strong>
                                Customer
                            </strong>

                            <strong>
                                Total Amount
                            </strong>

                            <strong>
                                Status
                            </strong>

                            <strong>
                                Actions
                            </strong>
                        </div>

                        {/* ROWS */}
                        {orders.map(
                            (order) => (
                                <div
                                    key={
                                        order.id
                                    }
                                    style={{
                                        display:
                                            "grid",
                                        gridTemplateColumns:
                                            "1.5fr 1.3fr 1fr 0.9fr 2.6fr",
                                        gap: 12,
                                        alignItems:
                                            "center",
                                        background:
                                            "#ffffff",
                                        padding:
                                            "15px 16px",
                                        color:
                                            "#334155",
                                        fontSize: 14,
                                        borderBottom:
                                            "1px solid #e5e7eb",
                                    }}
                                >
                                    <div>
                                        <strong
                                            style={{
                                                color:
                                                    SIES_BRANDING
                                                        .colors
                                                        .primary,
                                            }}
                                        >
                                            {
                                                order.orderNumber
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        {
                                            order.customerName ||
                                            "-"
                                        }
                                    </div>

                                    <div
                                        style={{
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {formatCurrency(
                                            order.totalAmount
                                        )}
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                ...statusStyle,
                                                ...getStatusStyle(
                                                    order.status
                                                ),
                                            }}
                                        >
                                            {
                                                order.status
                                            }
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            gap: 6,
                                            flexWrap:
                                                "wrap",
                                        }}
                                    >
                                        {getActionButtons(
                                            order
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div
                style={{
                    marginTop: 16,
                    textAlign:
                        "center",
                    color:
                        "#64748b",
                    fontSize: 12,
                }}
            >
                {
                    SIES_BRANDING.name
                }
                {" | "}
                {
                    SIES_BRANDING.shortName
                }
            </div>

            {/* ORDER DETAILS MODAL */}
            {showDetailsModal && (
                <div
                    style={{
                        position:
                            "fixed",
                        inset: 0,
                        background:
                            "rgba(15, 23, 42, 0.62)",
                        zIndex: 9999,
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        padding: 20,
                    }}
                    onClick={
                        closeDetailsModal
                    }
                >
                    <div
                        style={{
                            width:
                                "min(1050px, 100%)",
                            maxHeight:
                                "92vh",
                            overflowY:
                                "auto",
                            background:
                                "#ffffff",
                            borderRadius: 16,
                            boxShadow:
                                "0 25px 60px rgba(0,0,0,0.25)",
                        }}
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        {detailsLoading ||
                        !selectedOrder ? (
                            <div
                                style={{
                                    padding: 50,
                                    textAlign:
                                        "center",
                                    color:
                                        "#64748b",
                                }}
                            >
                                Loading order
                                details...
                            </div>
                        ) : (
                            <>
                                {/* MODAL HEADER */}
                                <div
                                    style={{
                                        padding:
                                            "18px 22px",
                                        borderBottom:
                                            "1px solid #e5e7eb",
                                        display:
                                            "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems:
                                            "center",
                                        gap: 15,
                                    }}
                                >
                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: 12,
                                        }}
                                    >
                                        <img
                                            src={
                                                SIES_BRANDING.logo
                                            }
                                            alt="SIES Logo"
                                            style={{
                                                width: 46,
                                                height: 46,
                                                objectFit:
                                                    "contain",
                                            }}
                                        />

                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    color:
                                                        SIES_BRANDING
                                                            .colors
                                                            .primary,
                                                }}
                                            >
                                                Order
                                                Details
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: 3,
                                                    fontSize: 12,
                                                    color:
                                                        "#64748b",
                                                }}
                                            >
                                                {
                                                    SIES_BRANDING
                                                        .shortName
                                                }
                                                {" • "}
                                                {
                                                    selectedOrder.orderNumber ||
                                                    "-"
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            closeDetailsModal
                                        }
                                        style={{
                                            border:
                                                "none",
                                            background:
                                                "#f1f5f9",
                                            color:
                                                "#334155",
                                            width: 36,
                                            height: 36,
                                            borderRadius: 8,
                                            cursor:
                                                "pointer",
                                            fontSize: 20,
                                            fontWeight: 700,
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* MODAL BODY */}
                                <div
                                    style={{
                                        padding:
                                            22,
                                    }}
                                >
                                    {/* SUMMARY CARDS */}
                                    <div
                                        style={{
                                            display:
                                                "grid",
                                            gridTemplateColumns:
                                                "repeat(4, minmax(0, 1fr))",
                                            gap: 12,
                                            marginBottom: 18,
                                        }}
                                    >
                                        <InfoCard
                                            label="Customer"
                                            value={getCustomerName(
                                                selectedOrder
                                            )}
                                        />

                                        <InfoCard
                                            label="Total Amount"
                                            value={formatCurrency(
                                                selectedOrder.totalAmount
                                            )}
                                            valueColor={
                                                SIES_BRANDING
                                                    .colors
                                                    .primary
                                            }
                                        />

                                        <div
                                            style={{
                                                border:
                                                    "1px solid #e5e7eb",
                                                borderRadius: 10,
                                                padding:
                                                    "13px 14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color:
                                                        "#64748b",
                                                    marginBottom: 7,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Order Status
                                            </div>

                                            <span
                                                style={{
                                                    ...statusStyle,
                                                    ...getStatusStyle(
                                                        selectedOrder.status
                                                    ),
                                                }}
                                            >
                                                {
                                                    selectedOrder.status ||
                                                    "-"
                                                }
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                border:
                                                    "1px solid #e5e7eb",
                                                borderRadius: 10,
                                                padding:
                                                    "13px 14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color:
                                                        "#64748b",
                                                    marginBottom: 7,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Payment Status
                                            </div>

                                            <span
                                                style={{
                                                    ...statusStyle,
                                                    ...getPaymentStatusStyle(
                                                        getPaymentStatus(
                                                            selectedOrder
                                                        )
                                                    ),
                                                }}
                                            >
                                                {getPaymentStatus(
                                                    selectedOrder
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CUSTOMER / PAYMENT / SHIPPING */}
                                    <div
                                        style={{
                                            display:
                                                "grid",
                                            gridTemplateColumns:
                                                "repeat(3, minmax(0, 1fr))",
                                            gap: 14,
                                            marginBottom: 20,
                                        }}
                                    >
                                        <DetailBox
                                            title="Customer Information"
                                            rows={[
                                                [
                                                    "Name",
                                                    getCustomerName(
                                                        selectedOrder
                                                    ),
                                                ],
                                                [
                                                    "Phone",
                                                    getCustomerPhone(
                                                        selectedOrder
                                                    ),
                                                ],
                                            ]}
                                        />

                                        <DetailBox
                                            title="Payment Information"
                                            rows={[
                                                [
                                                    "Payment Status",
                                                    getPaymentStatus(
                                                        selectedOrder
                                                    ),
                                                ],
                                                [
                                                    "Payment Method",
                                                    getPaymentMethod(
                                                        selectedOrder
                                                    ),
                                                ],
                                            ]}
                                        />

                                        <DetailBox
                                            title="Order Information"
                                            rows={[
                                                [
                                                    "Order Number",
                                                    selectedOrder.orderNumber ||
                                                        "-",
                                                ],
                                                [
                                                    "Order Date",
                                                    formatDate(
                                                        getOrderDate(
                                                            selectedOrder
                                                        )
                                                    ),
                                                ],
                                            ]}
                                        />
                                    </div>

                                    {/* SHIPPING */}
                                    <div
                                        style={{
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius: 10,
                                            padding:
                                                "15px 16px",
                                            marginBottom: 20,
                                            background:
                                                "#f8fafc",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 800,
                                                color:
                                                    "#334155",
                                                marginBottom: 7,
                                            }}
                                        >
                                            Shipping Address
                                        </div>

                                        <div
                                            style={{
                                                color:
                                                    "#475569",
                                                fontSize: 13,
                                                lineHeight:
                                                    1.6,
                                            }}
                                        >
                                            {getShippingAddress(
                                                selectedOrder
                                            ) ||
                                                "-"}
                                        </div>
                                    </div>

                                    {/* ITEMS */}
                                    <div
                                        style={{
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius: 10,
                                            overflow:
                                                "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding:
                                                    "14px 16px",
                                                background:
                                                    "#f1f5f9",
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                                fontWeight: 800,
                                                color:
                                                    "#334155",
                                                fontSize: 14,
                                            }}
                                        >
                                            Order Items
                                        </div>

                                        <div
                                            style={{
                                                overflowX:
                                                    "auto",
                                            }}
                                        >
                                            <table
                                                style={{
                                                    width:
                                                        "100%",
                                                    borderCollapse:
                                                        "collapse",
                                                    minWidth:
                                                        650,
                                                }}
                                            >
                                                <thead>
                                                    <tr
                                                        style={{
                                                            background:
                                                                "#ffffff",
                                                        }}
                                                    >
                                                        <th
                                                            style={
                                                                tableHeaderStyle
                                                            }
                                                        >
                                                            #
                                                        </th>

                                                        <th
                                                            style={
                                                                tableHeaderStyle
                                                            }
                                                        >
                                                            Product
                                                        </th>

                                                        <th
                                                            style={
                                                                tableHeaderStyle
                                                            }
                                                        >
                                                            Quantity
                                                        </th>

                                                        <th
                                                            style={
                                                                tableHeaderStyle
                                                            }
                                                        >
                                                            Unit Price
                                                        </th>

                                                        <th
                                                            style={
                                                                tableHeaderStyle
                                                            }
                                                        >
                                                            Total
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {getOrderItems(
                                                        selectedOrder
                                                    ).length >
                                                    0 ? (
                                                        getOrderItems(
                                                            selectedOrder
                                                        ).map(
                                                            (
                                                                item,
                                                                index
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        item.id ||
                                                                        index
                                                                    }
                                                                >
                                                                    <td
                                                                        style={
                                                                            tableCellStyle
                                                                        }
                                                                    >
                                                                        {index +
                                                                            1}
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            ...tableCellStyle,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        {getItemName(
                                                                            item
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        style={
                                                                            tableCellStyle
                                                                        }
                                                                    >
                                                                        {getItemQuantity(
                                                                            item
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        style={
                                                                            tableCellStyle
                                                                        }
                                                                    >
                                                                        {formatCurrency(
                                                                            getItemUnitPrice(
                                                                                item
                                                                            )
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            ...tableCellStyle,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        {formatCurrency(
                                                                            getItemTotal(
                                                                                item
                                                                            )
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    5
                                                                }
                                                                style={{
                                                                    ...tableCellStyle,
                                                                    textAlign:
                                                                        "center",
                                                                    padding:
                                                                        25,
                                                                    color:
                                                                        "#64748b",
                                                                }}
                                                            >
                                                                No order
                                                                items
                                                                found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>

                                                <tfoot>
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                4
                                                            }
                                                            style={{
                                                                padding:
                                                                    "13px 14px",
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                borderTop:
                                                                    "2px solid #e2e8f0",
                                                                color:
                                                                    "#334155",
                                                            }}
                                                        >
                                                            Total Amount
                                                        </td>

                                                        <td
                                                            style={{
                                                                padding:
                                                                    "13px 14px",
                                                                fontWeight: 900,
                                                                borderTop:
                                                                    "2px solid #e2e8f0",
                                                                color:
                                                                    SIES_BRANDING
                                                                        .colors
                                                                        .primary,
                                                                fontSize: 16,
                                                            }}
                                                        >
                                                            {formatCurrency(
                                                                selectedOrder.totalAmount
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* MODAL FOOTER */}
                                <div
                                    style={{
                                        padding:
                                            "15px 22px",
                                        borderTop:
                                            "1px solid #e5e7eb",
                                        display:
                                            "flex",
                                        justifyContent:
                                            "flex-end",
                                        gap: 8,
                                        flexWrap:
                                            "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            handlePrintOrderDetails
                                        }
                                        style={buttonStyle(
                                            "#0f766e"
                                        )}
                                    >
                                        Print
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleExportOrderPdf
                                        }
                                        style={buttonStyle(
                                            "#b91c1c"
                                        )}
                                    >
                                        PDF
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            closeDetailsModal
                                        }
                                        style={buttonStyle(
                                            "#475569"
                                        )}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

const InfoCard = ({
    label,
    value,
    valueColor,
}) => (
    <div
        style={{
            border:
                "1px solid #e5e7eb",
            borderRadius: 10,
            padding:
                "13px 14px",
            background:
                "#ffffff",
        }}
    >
        <div
            style={{
                fontSize: 11,
                color: "#64748b",
                marginBottom: 6,
                fontWeight: 700,
            }}
        >
            {label}
        </div>

        <div
            style={{
                fontSize: 14,
                fontWeight: 800,
                color:
                    valueColor ||
                    "#1e293b",
                wordBreak:
                    "break-word",
            }}
        >
            {value || "-"}
        </div>
    </div>
);

const DetailBox = ({
    title,
    rows,
}) => (
    <div
        style={{
            border:
                "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 15,
            background:
                "#ffffff",
        }}
    >
        <div
            style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#334155",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom:
                    "1px solid #e5e7eb",
            }}
        >
            {title}
        </div>

        {rows.map(
            ([label, value]) => (
                <div
                    key={label}
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        gap: 12,
                        marginBottom: 9,
                        fontSize: 12,
                    }}
                >
                    <span
                        style={{
                            color:
                                "#64748b",
                            fontWeight: 600,
                        }}
                    >
                        {label}
                    </span>

                    <span
                        style={{
                            color:
                                "#1e293b",
                            fontWeight: 700,
                            textAlign:
                                "right",
                            wordBreak:
                                "break-word",
                        }}
                    >
                        {value ||
                            "-"}
                    </span>
                </div>
            )
        )}
    </div>
);

const statusStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
};

const tableHeaderStyle = {
    padding: "11px 12px",
    textAlign: "left",
    fontSize: 12,
    color: "#475569",
    borderBottom:
        "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

const tableCellStyle = {
    padding: "11px 12px",
    fontSize: 13,
    color: "#334155",
    borderBottom:
        "1px solid #e5e7eb",
};

const buttonStyle = (
    background
) => ({
    border: "none",
    background,
    color: "#ffffff",
    padding: "9px 14px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
});

const actionButtonStyle = (
    background
) => ({
    border: "none",
    background,
    color: "#ffffff",
    padding: "7px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
});