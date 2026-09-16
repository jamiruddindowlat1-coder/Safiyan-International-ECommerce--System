import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import productService from "../../services/productService";
import { SIES_BRANDING } from "../../config/branding";

export default function VendorDashboard() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [ordersData, productsData] = await Promise.all([
                orderService.getOrders(),
                productService.getProducts(),
            ]);

            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (err) {
            console.error("Failed to load vendor dashboard:", err);
            setError(
                err?.message ||
                    "Failed to load vendor dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const normalizeStatus = (value) => {
        return String(value || "")
            .trim()
            .toLowerCase();
    };

    const formatCurrency = (amount) => {
        return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
    };

    const getOrderAmount = (order) => {
        return Number(
            order?.totalAmount ??
                order?.total ??
                order?.grandTotal ??
                0
        );
    };

    const dashboardData = useMemo(() => {
        const pendingOrders = orders.filter(
            (order) =>
                normalizeStatus(order.status) === "pending"
        );

        const processingOrders = orders.filter(
            (order) =>
                normalizeStatus(order.status) === "processing"
        );

        const shippedOrders = orders.filter(
            (order) =>
                normalizeStatus(order.status) === "shipped"
        );

        const deliveredOrders = orders.filter(
            (order) =>
                normalizeStatus(order.status) === "delivered"
        );

        const cancelledOrders = orders.filter(
            (order) =>
                normalizeStatus(order.status) === "cancelled"
        );

        const paidOrders = orders.filter(
            (order) => {
                const paymentStatus = normalizeStatus(
                    order.paymentStatus
                );

                return (
                    paymentStatus === "paid" ||
                    paymentStatus === "completed" ||
                    paymentStatus === "success" ||
                    paymentStatus === "successful"
                );
            }
        );

        const totalSales = paidOrders.reduce(
            (sum, order) =>
                sum + getOrderAmount(order),
            0
        );

        const deliveredSales = deliveredOrders.reduce(
            (sum, order) =>
                sum + getOrderAmount(order),
            0
        );

        const recentOrders = [...orders]
            .sort((a, b) => {
                const dateA = new Date(
                    a.createdAt ||
                        a.orderDate ||
                        a.date ||
                        0
                ).getTime();

                const dateB = new Date(
                    b.createdAt ||
                        b.orderDate ||
                        b.date ||
                        0
                ).getTime();

                return dateB - dateA;
            })
            .slice(0, 5);

        return {
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            paidOrders,
            totalSales,
            deliveredSales,
            recentOrders,
        };
    }, [orders]);

    const getStatusStyle = (status) => {
        const value = normalizeStatus(status);

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

    const getCustomerName = (order) => {
        return (
            order?.customerName ||
            order?.shippingName ||
            order?.userName ||
            order?.customer?.name ||
            "-"
        );
    };

    const getOrderNumber = (order) => {
        return (
            order?.orderNumber ||
            order?.number ||
            `#${order?.id || "-"}`
        );
    };

    const getOrderDate = (order) => {
        const value =
            order?.createdAt ||
            order?.orderDate ||
            order?.date;

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <section style={pageStyle}>
                <div style={headerStyle}>
                    <div>
                        <h1 style={titleStyle}>
                            Vendor Dashboard
                        </h1>

                        <p style={subtitleStyle}>
                            Manage your products and review
                            incoming orders.
                        </p>
                    </div>

                    <img
                        src={SIES_BRANDING.logo}
                        alt={SIES_BRANDING.shortName}
                        style={logoStyle}
                    />
                </div>

                <div style={loadingBoxStyle}>
                    Loading vendor dashboard...
                </div>
            </section>
        );
    }

    return (
        <section style={pageStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <div style={brandSmallStyle}>
                        {SIES_BRANDING.shortName}
                    </div>

                    <h1 style={titleStyle}>
                        Vendor Dashboard
                    </h1>

                    <p style={subtitleStyle}>
                        Manage your products and review
                        incoming orders.
                    </p>
                </div>

                <img
                    src={SIES_BRANDING.logo}
                    alt={SIES_BRANDING.name}
                    style={logoStyle}
                />
            </div>

            {error && (
                <div style={errorStyle}>
                    <strong>Dashboard Error:</strong>{" "}
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div style={statsGridStyle}>
                <StatCard
                    title="Total Products"
                    value={products.length}
                    description="Products in your catalog"
                    link="/vendor/products"
                />

                <StatCard
                    title="Total Orders"
                    value={orders.length}
                    description="Orders associated with your vendor"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Total Sales"
                    value={formatCurrency(
                        dashboardData.totalSales
                    )}
                    description="Paid order revenue"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Pending Orders"
                    value={
                        dashboardData.pendingOrders.length
                    }
                    description="Orders waiting for processing"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Processing"
                    value={
                        dashboardData.processingOrders.length
                    }
                    description="Orders being processed"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Shipped"
                    value={
                        dashboardData.shippedOrders.length
                    }
                    description="Orders currently shipped"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Delivered"
                    value={
                        dashboardData.deliveredOrders.length
                    }
                    description="Successfully delivered orders"
                    link="/vendor/orders"
                />

                <StatCard
                    title="Cancelled"
                    value={
                        dashboardData.cancelledOrders.length
                    }
                    description="Cancelled orders"
                    link="/vendor/orders"
                />
            </div>

            {/* Quick Actions */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <div>
                        <h2 style={sectionTitleStyle}>
                            Quick Actions
                        </h2>

                        <p style={sectionSubtitleStyle}>
                            Access your main vendor management
                            areas.
                        </p>
                    </div>
                </div>

                <div style={actionsGridStyle}>
                    <Link
                        to="/vendor/products"
                        style={actionCardStyle}
                    >
                        <div style={actionIconStyle}>
                            +
                        </div>

                        <div>
                            <strong style={actionTitleStyle}>
                                Vendor Products
                            </strong>

                            <p style={actionTextStyle}>
                                Add, edit and manage your
                                products.
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/vendor/orders"
                        style={actionCardStyle}
                    >
                        <div style={actionIconStyle}>
                            #
                        </div>

                        <div>
                            <strong style={actionTitleStyle}>
                                Vendor Orders
                            </strong>

                            <p style={actionTextStyle}>
                                Review orders and update
                                delivery status.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Sales Overview */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <div>
                        <h2 style={sectionTitleStyle}>
                            Sales Overview
                        </h2>

                        <p style={sectionSubtitleStyle}>
                            Real order and payment information
                            from the system.
                        </p>
                    </div>
                </div>

                <div style={overviewGridStyle}>
                    <div style={overviewCardStyle}>
                        <span style={overviewLabelStyle}>
                            Paid Sales
                        </span>

                        <strong style={overviewValueStyle}>
                            {formatCurrency(
                                dashboardData.totalSales
                            )}
                        </strong>

                        <span style={overviewHintStyle}>
                            {dashboardData.paidOrders.length}{" "}
                            paid order(s)
                        </span>
                    </div>

                    <div style={overviewCardStyle}>
                        <span style={overviewLabelStyle}>
                            Delivered Sales
                        </span>

                        <strong style={overviewValueStyle}>
                            {formatCurrency(
                                dashboardData.deliveredSales
                            )}
                        </strong>

                        <span style={overviewHintStyle}>
                            {dashboardData.deliveredOrders.length}{" "}
                            delivered order(s)
                        </span>
                    </div>

                    <div style={overviewCardStyle}>
                        <span style={overviewLabelStyle}>
                            Active Orders
                        </span>

                        <strong style={overviewValueStyle}>
                            {
                                dashboardData.pendingOrders
                                    .length +
                                dashboardData.processingOrders
                                    .length +
                                dashboardData.shippedOrders
                                    .length
                            }
                        </strong>

                        <span style={overviewHintStyle}>
                            Pending, processing and shipped
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <div>
                        <h2 style={sectionTitleStyle}>
                            Recent Orders
                        </h2>

                        <p style={sectionSubtitleStyle}>
                            Latest orders associated with your
                            vendor account.
                        </p>
                    </div>

                    <Link
                        to="/vendor/orders"
                        style={viewAllStyle}
                    >
                        View All Orders
                    </Link>
                </div>

                {dashboardData.recentOrders.length === 0 ? (
                    <div style={emptyStyle}>
                        No orders found.
                    </div>
                ) : (
                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>
                                        Order Number
                                    </th>

                                    <th style={thStyle}>
                                        Customer
                                    </th>

                                    <th style={thStyle}>
                                        Amount
                                    </th>

                                    <th style={thStyle}>
                                        Status
                                    </th>

                                    <th style={thStyle}>
                                        Date
                                    </th>

                                    <th style={thStyle}>
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {dashboardData.recentOrders.map(
                                    (order) => (
                                        <tr
                                            key={
                                                order.id ||
                                                order.orderNumber
                                            }
                                        >
                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                <strong>
                                                    {getOrderNumber(
                                                        order
                                                    )}
                                                </strong>
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {getCustomerName(
                                                    order
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {formatCurrency(
                                                    getOrderAmount(
                                                        order
                                                    )
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                <span
                                                    style={{
                                                        ...statusStyle,
                                                        ...getStatusStyle(
                                                            order.status
                                                        ),
                                                    }}
                                                >
                                                    {order.status ||
                                                        "Pending"}
                                                </span>
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {getOrderDate(
                                                    order
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                <Link
                                                    to="/vendor/orders"
                                                    style={
                                                        viewButtonStyle
                                                    }
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Brand */}
            <div style={footerBrandStyle}>
                <img
                    src={SIES_BRANDING.logo}
                    alt={SIES_BRANDING.shortName}
                    style={footerLogoStyle}
                />

                <span>
                    {SIES_BRANDING.name} |{" "}
                    {SIES_BRANDING.shortName}
                </span>
            </div>
        </section>
    );
}

function StatCard({
    title,
    value,
    description,
    link,
}) {
    return (
        <Link
            to={link}
            style={statCardStyle}
        >
            <div style={statTopStyle}>
                <span style={statTitleStyle}>
                    {title}
                </span>

                <span style={statArrowStyle}>
                    →
                </span>
            </div>

            <strong style={statValueStyle}>
                {value}
            </strong>

            <span style={statDescriptionStyle}>
                {description}
            </span>
        </Link>
    );
}

/* =========================
   Styles
========================= */

const pageStyle = {
    padding: "28px",
    maxWidth: "1400px",
    margin: "0 auto",
    color: "#1f2937",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    marginBottom: "28px",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(15, 76, 129, 0.08)",
};

const brandSmallStyle = {
    color: "#14919b",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "6px",
};

const titleStyle = {
    margin: 0,
    color: "#0f4c81",
    fontSize: "30px",
    fontWeight: 800,
};

const subtitleStyle = {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
};

const logoStyle = {
    width: "76px",
    height: "76px",
    objectFit: "contain",
};

const statsGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
};

const statCardStyle = {
    display: "block",
    textDecoration: "none",
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 76, 129, 0.06)",
    transition: "transform 0.2s ease",
};

const statTopStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
};

const statTitleStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
};

const statArrowStyle = {
    color: "#14919b",
    fontSize: "20px",
    fontWeight: 800,
};

const statValueStyle = {
    display: "block",
    color: "#0f4c81",
    fontSize: "28px",
    fontWeight: 800,
    marginTop: "12px",
};

const statDescriptionStyle = {
    display: "block",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "7px",
};

const sectionStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 76, 129, 0.05)",
    padding: "22px",
    marginBottom: "24px",
};

const sectionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
};

const sectionTitleStyle = {
    margin: 0,
    color: "#0f4c81",
    fontSize: "20px",
    fontWeight: 800,
};

const sectionSubtitleStyle = {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
};

const actionsGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
};

const actionCardStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    textDecoration: "none",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
};

const actionIconStyle = {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f4c81",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 800,
    flexShrink: 0,
};

const actionTitleStyle = {
    color: "#0f4c81",
    fontSize: "15px",
};

const actionTextStyle = {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
};

const overviewGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
};

const overviewCardStyle = {
    padding: "20px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
};

const overviewLabelStyle = {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
};

const overviewValueStyle = {
    display: "block",
    marginTop: "8px",
    color: "#0f4c81",
    fontSize: "25px",
    fontWeight: 800,
};

const overviewHintStyle = {
    display: "block",
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "12px",
};

const viewAllStyle = {
    color: "#0f4c81",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: "13px",
};

const tableWrapperStyle = {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
};

const thStyle = {
    textAlign: "left",
    padding: "13px 14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 800,
    borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
    padding: "14px",
    borderBottom: "1px solid #eef2f7",
    color: "#334155",
    fontSize: "13px",
};

const statusStyle = {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "capitalize",
};

const viewButtonStyle = {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "7px",
    background: "#0f4c81",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 700,
};

const emptyStyle = {
    padding: "35px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "10px",
};

const loadingBoxStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
    border: "1px solid #e5e7eb",
};

const errorStyle = {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "13px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
};

const footerBrandStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    padding: "22px 10px 8px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
};

const footerLogoStyle = {
    width: "28px",
    height: "28px",
    objectFit: "contain",
};

