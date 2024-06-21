'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import { usePathname } from 'next/navigation'
import { useBoolean } from 'ahooks'
import type { LangFuseConfig, LangSmithConfig } from './type'
import { TracingProvider } from './type'
import TracingIcon from './tracing-icon'
import ToggleExpandBtn from './toggle-fold-btn'
import ConfigButton from './config-button'
import { LangfuseIcon, LangsmithIcon } from '@/app/components/base/icons/src/public/tracing'
import Indicator from '@/app/components/header/indicator'
import { fetchTracingConfig as doFetchTracingConfig, fetchTracingStatus, updateTracingStatus } from '@/service/apps'
import type { TracingStatus } from '@/models/app'
import Toast from '@/app/components/base/toast'

const I18N_PREFIX = 'app.tracing'

const Title = ({
  className,
}: {
  className?: string
}) => {
  const { t } = useTranslation()

  return (
    <div className={cn(className, 'text-lg font-semibold text-gray-900')}>
      {t('appOverview.overview.title')}
    </div>
  )
}
const Panel: FC = () => {
  const { t } = useTranslation()
  const pathname = usePathname()
  const matched = pathname.match(/\/app\/([^/]+)/)
  const appId = (matched?.length && matched[1]) ? matched[1] : ''

  const [isLoaded, {
    setTrue: setLoaded,
  }] = useBoolean(false)

  const [tracingStatus, setTracingStatus] = useState<TracingStatus | null>(null)
  const enabled = tracingStatus?.enabled || false
  const handleTracingStatusChange = async (tracingStatus: TracingStatus) => {
    await updateTracingStatus({ appId, body: tracingStatus })
    setTracingStatus(tracingStatus)
    Toast.notify({
      type: 'success',
      message: t('common.api.success'),
    })
  }

  const handleTracingEnabledChange = (enabled: boolean) => {
    handleTracingStatusChange({
      tracing_provider: tracingStatus?.tracing_provider || null,
      enabled,
    })
  }
  const handleChooseProvider = (provider: TracingProvider) => {
    handleTracingStatusChange({
      tracing_provider: provider,
      enabled,
    })
  }
  const inUseTracingProvider: TracingProvider | null = tracingStatus?.tracing_provider || null
  const InUseProviderIcon = inUseTracingProvider === TracingProvider.langSmith ? LangsmithIcon : LangfuseIcon

  const [langSmithConfig, setLangSmithConfig] = useState<LangSmithConfig | null>(null)
  const [langFuseConfig, setLangFuseConfig] = useState<LangFuseConfig | null>(null)
  const hasConfiguredTracing = !!(langSmithConfig || langFuseConfig)

  const fetchTracingConfig = async () => {
    const { tracing_config: langSmithConfig } = await doFetchTracingConfig({ appId, provider: TracingProvider.langSmith })
    setLangSmithConfig(langSmithConfig as LangSmithConfig)
    const { tracing_config: langFuseConfig } = await doFetchTracingConfig({ appId, provider: TracingProvider.langfuse })
    setLangFuseConfig(langFuseConfig as LangFuseConfig)
  }

  const handleTracingConfigUpdated = (provider: TracingProvider, payload: LangSmithConfig | LangFuseConfig) => {
    if (provider === TracingProvider.langSmith)
      setLangSmithConfig(payload as LangSmithConfig)
    else
      setLangFuseConfig(payload as LangFuseConfig)
  }

  const handleTracingConfigRemoved = (provider: TracingProvider) => {
    if (provider === TracingProvider.langSmith)
      setLangSmithConfig(null)
    else
      setLangFuseConfig(null)
  }

  useEffect(() => {
    (async () => {
      const tracingStatus = await fetchTracingStatus({ appId })
      setTracingStatus(tracingStatus)
      await fetchTracingConfig()
      setLoaded()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isFold, setFold] = useState(false)

  if (!isLoaded) {
    return <div className='mb-3'>
      <Title />
    </div>
  }

  if (!isFold && !hasConfiguredTracing) {
    return (
      <div className='mb-3'>
        <Title />
        <div className='mt-2 flex justify-between p-3 pr-4 items-center bg-white border-[0.5px] border-black/8 rounded-xl shadow-md'>
          <div className='flex space-x-2'>
            <TracingIcon size='lg' className='m-1' />
            <div>
              <div className='mb-0.5 leading-6 text-base font-semibold text-gray-900'>{t(`${I18N_PREFIX}.title`)}</div>
              <div className='flex justify-between leading-4 text-xs font-normal text-gray-500'>
                <span className='mr-2'>{t(`${I18N_PREFIX}.description`)}</span>
                <div className='flex space-x-3'>
                  <LangsmithIcon className='h-4' />
                  <LangfuseIcon className='h-4' />
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-1'>
            <ConfigButton
              appId={appId}
              hasConfigured={false}
              enabled={enabled}
              onStatusChange={handleTracingEnabledChange}
              onChooseProvider={handleChooseProvider}
              langSmithConfig={langSmithConfig}
              langFuseConfig={langFuseConfig}
              onConfigUpdated={handleTracingConfigUpdated}
              onConfigRemoved={handleTracingConfigRemoved}
            />
            <ToggleExpandBtn isFold={isFold} onFoldChange={setFold} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='mb-3 flex justify-between items-center'>
      <Title />
      <div className='flex items-center p-2 rounded-xl border-[0.5px] border-gray-200 shadow-xs hover:bg-gray-100'>
        {!hasConfiguredTracing
          ? <>
            <TracingIcon size='md' className='mr-2' />
            <div className='leading-5 text-sm font-semibold text-gray-700'>{t(`${I18N_PREFIX}.title`)}</div>
          </>
          : <InUseProviderIcon className='ml-1 h-4' />}

        {hasConfiguredTracing && (
          <div className='ml-4 mr-1 flex items-center'>
            <Indicator color={enabled ? 'green' : 'gray'} />
            <div className='ml-1.5 text-xs font-semibold text-gray-500 uppercase'>
              {t(`${I18N_PREFIX}.${enabled ? 'enabled' : 'disabled'}`)}
            </div>
          </div>
        )}

        {hasConfiguredTracing && (
          <div className='ml-2 w-px h-3.5 bg-gray-200'></div>
        )}

        <ConfigButton
          appId={appId}
          hasConfigured
          className='ml-2'
          enabled={enabled}
          onStatusChange={handleTracingEnabledChange}
          onChooseProvider={handleChooseProvider}
          langSmithConfig={langSmithConfig}
          langFuseConfig={langFuseConfig}
          onConfigUpdated={handleTracingConfigUpdated}
          onConfigRemoved={handleTracingConfigRemoved}
        />
        {!hasConfiguredTracing && (
          <>
            <div className='mx-2 w-px h-3.5 bg-gray-200'></div>
            <ToggleExpandBtn isFold={isFold} onFoldChange={setFold} />
          </>
        )}
      </div>
    </div>
  )
}
export default React.memo(Panel)