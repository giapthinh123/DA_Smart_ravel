'use client';
import { useRef } from 'react';
import { Form, Field } from 'react-final-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const ForgotPasswordPage = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden');

    const validate = (data: any) => {
        let errors: any = {};
        if (!data.username) errors.username = 'Vui lòng nhập tên tài khoản';
        if (!data.email) errors.email = 'Vui lòng nhập email';
        return errors;
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot_password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: data.username, email: data.email })
            });
            const resData = await response.json();
            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: resData.message || 'Đã gửi yêu cầu đặt lại mật khẩu, vui lòng kiểm tra email.'
                });
            } else {
                const errorMessage = resData.error || resData.message || 'Email hoặc người dùng không tồn tại';
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: errorMessage
                });
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    };

    const isFormFieldValid = (meta: any) => !!(meta.touched && meta.error);
    const getFormErrorMessage = (meta: any) => isFormFieldValid(meta) && <small className="p-error block mt-1">{meta.error}</small>;

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/layout/images/logo-white.svg" alt="logo" className="mb-3" style={{ height: '80px', borderRadius: '50%' }} />
                            <div className="text-900 text-3xl font-medium mb-3">Quên mật khẩu</div>
                            <span className="text-600 font-medium">Nhập tên tài khoản và email của bạn</span>
                        </div>

                        <Form
                            onSubmit={onSubmit}
                            initialValues={{ username: '', email: '' }}
                            validate={validate}
                            render={({ handleSubmit }) => (
                                <form onSubmit={handleSubmit} className="flex flex-column">
                                    <div className="mb-4">
                                        <Field
                                            name="username"
                                            render={({ input, meta }) => (
                                                <div>
                                                    <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                                        Tên tài khoản
                                                    </label>
                                                    <InputText id="username" {...input} autoFocus className={classNames('w-full md:w-30rem', { 'p-invalid': isFormFieldValid(meta) })} />
                                                    {getFormErrorMessage(meta)}
                                                </div>
                                            )}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <Field
                                            name="email"
                                            render={({ input, meta }) => (
                                                <div>
                                                    <label htmlFor="email" className="block text-900 font-medium text-xl mb-2">
                                                        Email
                                                    </label>
                                                    <InputText id="email" {...input} type="email" className={classNames('w-full md:w-30rem', { 'p-invalid': isFormFieldValid(meta) })} />
                                                    {getFormErrorMessage(meta)}
                                                </div>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" label={loading ? 'Đang gửi...' : 'Gửi yêu cầu'} className="w-full p-3 text-xl mb-4" disabled={loading} />

                                    <div className="text-center">
                                        <Link href="/auth/login" className="text-600 hover:text-primary text-decoration-none">
                                            Quay lại đăng nhập
                                        </Link>
                                    </div>
                                </form>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
