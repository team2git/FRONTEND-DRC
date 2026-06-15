import PageMeta from "../../components/common/PageMeta";

export default function Analytics() {
    return (
        <>
            <PageMeta
                title="Analytics | IDRMIS"
                description="Analytics Page"
            />
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                    Analytics
                </h4>
                <div className="p-4">
                    <p>This is the Analytics page.</p>
                </div>
            </div>
        </>
    );
}
