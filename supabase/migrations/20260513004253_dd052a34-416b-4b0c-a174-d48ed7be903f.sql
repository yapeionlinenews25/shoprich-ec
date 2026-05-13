
REVOKE ALL ON FUNCTION public.is_order_customer(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_order_stakeholder(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_order_customer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_stakeholder(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
